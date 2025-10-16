from flask import Flask, request, jsonify, abort
from submissions import SubmissionsStore
import os
import time
import jwt
import requests
import json

app = Flask(__name__)

# Store file path next to this script
BASE_DIR = os.path.dirname(__file__)
STORE_PATH = os.path.join(BASE_DIR, 'submissions.xml')

store = SubmissionsStore(STORE_PATH)

# GitHub App configuration (provide via environment variables)
GITHUB_APP_ID = os.environ.get('GITHUB_APP_ID')
GITHUB_INSTALLATION_ID = os.environ.get('GITHUB_INSTALLATION_ID')
GITHUB_PRIVATE_KEY = os.environ.get('GITHUB_PRIVATE_KEY')  # PEM string
TARGET_OWNER = os.environ.get('TARGET_OWNER', 'geraw')
TARGET_REPO = os.environ.get('TARGET_REPO', 'AliceBobCasino')


def _create_jwt(app_id, private_key_pem):
    now = int(time.time())
    payload = {
        'iat': now - 60,
        'exp': now + (10 * 60),  # 10 minute expiration
        'iss': str(app_id)
    }
    token = jwt.encode(payload, private_key_pem, algorithm='RS256')
    # PyJWT may return bytes in older versions
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def _get_installation_access_token():
    if not (GITHUB_APP_ID and GITHUB_PRIVATE_KEY and GITHUB_INSTALLATION_ID):
        raise RuntimeError('Missing GitHub App configuration (GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_INSTALLATION_ID)')

    jwt_token = _create_jwt(GITHUB_APP_ID, GITHUB_PRIVATE_KEY)

    url = f'https://api.github.com/app/installations/{GITHUB_INSTALLATION_ID}/access_tokens'
    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'Accept': 'application/vnd.github+json'
    }
    r = requests.post(url, headers=headers)
    if r.status_code != 201:
        raise RuntimeError(f'Failed to obtain installation token: {r.status_code} {r.text}')
    return r.json().get('token')


def _create_github_issue(access_token, title, body, labels=None):
    url = f'https://api.github.com/repos/{TARGET_OWNER}/{TARGET_REPO}/issues'
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github+json'
    }
    payload = {'title': title, 'body': body}
    if labels:
        payload['labels'] = labels
    r = requests.post(url, headers=headers, json=payload)
    if r.status_code not in (200, 201):
        raise RuntimeError(f'Failed to create issue: {r.status_code} {r.text}')
    return r.json()


@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json(force=True)
    if not data:
        return abort(400, 'missing JSON body')

    required = ('challenge_name', 'solution_code', 'email')
    if not all(k in data for k in required):
        return abort(400, f'missing fields, required: {required}')

    entry = store.add_submission(
        challenge=data['challenge_name'],
        solution=data['solution_code'],
        email=data['email']
    )

    return jsonify({'status': 'ok', 'id': entry['id']})


@app.route('/ladderboard', methods=['GET'])
def ladderboard():
    # Return all submissions as JSON for simplicity
    subs = store.list_submissions()
    return jsonify(subs)


@app.route('/create_issue', methods=['POST'])
def create_issue():
    """Create a GitHub issue using GitHub App credentials.

    Expects JSON: {challenge_name, solution_code, email}
    """
    data = request.get_json(force=True)
    if not data:
        return abort(400, 'missing JSON body')

    required = ('challenge_name', 'solution_code', 'email')
    if not all(k in data for k in required):
        return abort(400, f'missing fields, required: {required}')

    title = f"Solution: {data.get('challenge_name', 'unknown')}"
    # Build body with submission fields; code is wrapped in triple backticks
    body = f"Submitted by: {data.get('email', '')}\n\nChallenge: {data.get('challenge_name', '')}\n\nCode:\n```\n{data.get('solution_code','')}\n```"

    try:
        token = _get_installation_access_token()
        issue = _create_github_issue(token, title, body, labels=['submission'])
    except Exception as e:
        return abort(500, str(e))

    # Optionally also store the submission locally
    store.add_submission(data.get('challenge_name'), data.get('solution_code'), data.get('email'))

    return jsonify({'status': 'ok', 'issue_url': issue.get('html_url')})


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)

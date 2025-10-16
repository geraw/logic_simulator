#!/usr/bin/env python3
"""Parse GitHub issue body (from Issue Form) and append submission to submissions.xml

This script expects the issue form fields to be present in the issue body. It
is intentionally simple and tolerant of formatting differences.
"""
import re
import sys
from pathlib import Path
from datetime import datetime
import xml.etree.ElementTree as ET
from xml.dom import minidom

REPO_ROOT = Path(__file__).resolve().parents[1]
SUBMISSIONS_FILE = REPO_ROOT / 'submissions.xml'


def parse_issue_body(body: str):
    # Issue forms store values as plain text in the issue body; try to extract fields by label
    fields = {}
    # Match lines like '### Challenge name' (but we used simple label+value lines), so fallback to simple heuristics
    # We'll try to find the challenge_name, solution_code (anything between triple-backticks or the long section), and email

    # Extract triple backticks block if present
    code_block = None
    m = re.search(r'```(?:\w+)?\n([\s\S]*?)\n```', body)
    if m:
        code_block = m.group(1).strip()

    # Try to find labelled lines like 'Challenge name: 00-checksum' or 'Challenge name\n00-checksum'
    def find_label(label):
        # look for 'label: value' on a single line (case-insensitive)
        rx = re.compile(rf'{re.escape(label)}\s*[:\-]?\s*(.+)', re.IGNORECASE)
        for line in body.splitlines():
            m = rx.match(line.strip())
            if m:
                return m.group(1).strip()
        return None

    fields['challenge_name'] = find_label('Challenge name') or find_label('challenge_name')
    fields['email'] = find_label('Email') or find_label('email')
    if code_block:
        fields['solution_code'] = code_block
    else:
        # If no code block, try to find a long block after 'Solution code' label
        # Find the line index of 'Solution code' and then capture following lines until next blank line or end
        lines = body.splitlines()
        for i, line in enumerate(lines):
            if re.search(r'solution code', line, re.IGNORECASE):
                # grab following non-empty lines
                collected = []
                for j in range(i+1, len(lines)):
                    if not lines[j].strip():
                        break
                    collected.append(lines[j])
                fields['solution_code'] = '\n'.join(collected).strip()
                break

    return fields


def append_submission(challenge, email, code):
    if not SUBMISSIONS_FILE.exists():
        root = ET.Element('submissions')
    else:
        tree = ET.parse(SUBMISSIONS_FILE)
        root = tree.getroot()

    # compute next id
    ids = [int(s.get('id')) for s in root.findall('submission') if s.get('id') and s.get('id').isdigit()]
    next_id = max(ids) + 1 if ids else 1

    sub = ET.SubElement(root, 'submission', {'id': str(next_id)})
    ch = ET.SubElement(sub, 'challenge')
    ch.text = challenge or 'unknown'
    em = ET.SubElement(sub, 'email')
    em.text = email or ''
    code_el = ET.SubElement(sub, 'code')
    code_el.text = code or ''
    ts = ET.SubElement(sub, 'timestamp')
    ts.text = datetime.utcnow().isoformat() + 'Z'

    xmlstr = minidom.parseString(ET.tostring(root, 'utf-8')).toprettyxml(indent="  ")
    SUBMISSIONS_FILE.write_text(xmlstr, encoding='utf-8')


def main():
    # GitHub Actions will set ISSUE_BODY in the environment; fall back to reading stdin
    import os
    body = os.environ.get('ISSUE_BODY')
    if not body:
        body = sys.stdin.read()

    # If ISSUE_BODY came as JSON (toJson was used), it may be quoted; try to unquote if it's in quotes
    if body and body.startswith('"') and body.endswith('"'):
        body = body[1:-1].encode('utf-8').decode('unicode_escape')

    fields = parse_issue_body(body or '')

    if not fields.get('solution_code'):
        print('No solution code found in issue body; aborting')
        sys.exit(1)

    append_submission(fields.get('challenge_name'), fields.get('email'), fields.get('solution_code'))
    print('Appended submission')


if __name__ == '__main__':
    main()

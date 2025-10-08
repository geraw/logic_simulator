import os
import json

challenges_dir = 'challenges'
challenges = [d for d in os.listdir(challenges_dir) if os.path.isdir(os.path.join(challenges_dir, d)) and not d.startswith('.') and d != '__pycache__']
challenges.sort()

with open(os.path.join(challenges_dir, 'challenges.json'), 'w') as f:
    json.dump(challenges, f, indent=4)

print(f"Generated challenges/challenges.json with {len(challenges)} challenges.")

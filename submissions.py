"""Simple XML-backed submissions store.

Format (submissions.xml):
<submissions>
  <submission id="1">
    <challenge>00-checksum</challenge>
    <email>alice@example.com</email>
    <code><![CDATA[...]]></code>
    <timestamp>2025-10-16T12:00:00Z</timestamp>
  </submission>
</submissions>
"""
import xml.etree.ElementTree as ET
from xml.dom import minidom
import os
import threading
from datetime import datetime


class SubmissionsStore:
    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()
        if not os.path.exists(self.path):
            # create empty root
            root = ET.Element('submissions')
            self._write_tree(root)

    def _read_tree(self):
        tree = ET.parse(self.path)
        return tree.getroot()

    def _write_tree(self, root):
        # pretty print
        xmlstr = minidom.parseString(ET.tostring(root, 'utf-8')).toprettyxml(indent="  ")
        with open(self.path, 'w', encoding='utf-8') as f:
            f.write(xmlstr)

    def list_submissions(self):
        with self.lock:
            root = self._read_tree()
            out = []
            for sub in root.findall('submission'):
                out.append({
                    'id': sub.get('id'),
                    'challenge': sub.findtext('challenge'),
                    'email': sub.findtext('email'),
                    'code': sub.findtext('code'),
                    'timestamp': sub.findtext('timestamp')
                })
            return out

    def add_submission(self, challenge, solution, email):
        with self.lock:
            root = self._read_tree()
            # compute next id
            ids = [int(s.get('id')) for s in root.findall('submission') if s.get('id') and s.get('id').isdigit()]
            next_id = max(ids) + 1 if ids else 1

            sub = ET.SubElement(root, 'submission', {'id': str(next_id)})
            ch = ET.SubElement(sub, 'challenge')
            ch.text = challenge
            em = ET.SubElement(sub, 'email')
            em.text = email
            code = ET.SubElement(sub, 'code')
            # store code inside CDATA-like wrapper by using CDATA markers in text
            code.text = solution
            ts = ET.SubElement(sub, 'timestamp')
            ts.text = datetime.utcnow().isoformat() + 'Z'

            self._write_tree(root)

            return {'id': str(next_id), 'challenge': challenge, 'email': email}

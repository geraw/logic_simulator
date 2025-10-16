Using Google Sheets as a public ladderboard (no server)

This guide shows two serverless options to maintain a public ladderboard using Google:

A) Read-only ladderboard (published CSV)
B) Read + write via Google Form (responses populate the Sheet)

A) Publish a Sheet as CSV (read-only in the UI)
1. Create a Google Sheet witcolumns you want (e.g., Timestamp, Challenge, Email, Score, Notes).
2. File -> Share -> Publish to the web -> Select the sheet and choose "Comma-separated values (CSV)" and click Publish.
3. Copy the generated URL (it will look like https://docs.google.com/spreadsheets/d/e/<ID>/pub?output=csv).
4. Open `webui/static/app.js` and set `PUBLISHED_SHEET_CSV` to that URL. The UI will fetch and render it.

B) Allow users to append via Google Form (easy write without server)
1. Create a Google Form with matching fields (Timestamp can be added automatically by the form responses sheet).
2. In the Form editor, click Responses -> Create Spreadsheet to link it to a Sheet.
3. Click the Send button, then the link icon to get the live form link. Open it in the browser and view page source or use DevTools Network to find the POST `formResponse` endpoint and the `entry.<id>` names for each field.
   - Alternatively, you can inspect the form HTML: each input has a name like `entry.123456789`.
4. In `webui/static/app.js`, set `GOOGLE_FORM_ACTION` to `https://docs.google.com/forms/d/e/<FORM_ID>/formResponse` and update `FORM_ENTRY_MAP` mapping logical names to the `entry.*` keys.
5. Use `submitToGoogleForm(GOOGLE_FORM_ACTION, { [FORM_ENTRY_MAP.challenge]: 'myChallenge', [FORM_ENTRY_MAP.email]: 'a@b.c', [FORM_ENTRY_MAP.code]: '...' })` to submit.

Notes and caveats
- Google Form submissions may not appear instantly in the published CSV (sheets can take a few seconds to update).
- Forms are public and can be abused; consider adding a simple client-side captcha or rate-limiting UX.
- If you need more validation or protection, consider using Google Apps Script (serverless) with a simple secret check.

If you want, I can:
- Implement the `PUBLISHED_SHEET_CSV` and `GOOGLE_FORM_ACTION` values directly in `app.js` if you provide the URLs/IDs.
- Add a small submission UI in the score modal to POST to the Google Form after users pass scoring.

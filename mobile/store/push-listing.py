#!/usr/bin/env python3
"""Vie kauppatekstit (listing.fi.json) ja markkinointikuvat kauppoihin.

    python3 mobile/store/push-listing.py ios  [--live] [--screenshots]
    python3 mobile/store/push-listing.py play [--live] [--screenshots] [--no-listing]
        [--aab=PATH --mapping=PATH --track=internal|production --version-name=X.Y.Z]

Ilman --live vain tulostaa, mitä muuttuisi. Avaimet tulevat repon ulkopuolelta:
- iOS: `source ~/code/appstoreconnect.env` (ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH)
- Play: PLAY_KEY_JSON (palvelutilin avaintiedosto)

iOS: kaikki tekstit ja kuvat menevät muokattavaan versioon
(PREPARE_FOR_SUBMISSION), joten luo versio ensin.
Play: tekstit, kuvat ja (--aab) bundle samassa editissä, jotta listaus ja build
menevät tarkistukseen yhdessä. Julkaisutiedot whatsNew.android.
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LISTING = json.loads((ROOT / 'listing.fi.json').read_text())
APP_ID = '6779765394'
PACKAGE = 'com.koetutka'
LIVE = '--live' in sys.argv
SHOTS = '--screenshots' in sys.argv
NO_LISTING = '--no-listing' in sys.argv
OPTS = dict(a[2:].split('=', 1) for a in sys.argv if a.startswith('--') and '=' in a)


def show(label, old, new):
    if (old or '') == (new or ''):
        print(f'  = {label}: ennallaan')
    else:
        print(f'  ~ {label}: {len(old or "")} → {len(new or "")} merkkiä')


# ---------------------------------------------------------------- App Store
def asc():
    import jwt
    import requests

    key = Path(os.path.expanduser(os.environ['ASC_KEY_PATH'])).read_text()

    def token():
        now = int(time.time())
        return jwt.encode(
            {'iss': os.environ['ASC_ISSUER_ID'], 'iat': now, 'exp': now + 1100, 'aud': 'appstoreconnect-v1'},
            key, algorithm='ES256', headers={'kid': os.environ['ASC_KEY_ID'], 'typ': 'JWT'})

    def req(method, path, body=None, **kw):
        url = path if path.startswith('http') else 'https://api.appstoreconnect.apple.com' + path
        r = requests.request(method, url, json=body, headers={'Authorization': f'Bearer {token()}'}, **kw)
        if r.status_code >= 400:
            raise SystemExit(f'{method} {path}: {r.status_code} {r.text[:800]}')
        return r.json() if r.text else {}

    def patch(kind, id_, attrs):
        print(f'    PATCH {kind} {id_}: {", ".join(attrs)}')
        if LIVE:
            req('PATCH', f'/v1/{kind}/{id_}', {'data': {'type': kind, 'id': id_, 'attributes': attrs}})

    versions = req('GET', f'/v1/apps/{APP_ID}/appStoreVersions', params={'limit': 10})['data']
    live = next(v for v in versions if v['attributes']['appStoreState'] == 'READY_FOR_SALE')
    editable = next((v for v in versions if v['attributes']['appStoreState'] in
                     ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED')), None)

    def fi_loc(version):
        locs = req('GET', f"/v1/appStoreVersions/{version['id']}/appStoreVersionLocalizations")['data']
        return next(l for l in locs if l['attributes']['locale'].startswith('fi'))

    # Myynnissä olevaan versioon ei kosketa: tekstit kertovat uuden version
    # ominaisuuksista, joten ne saavat näkyä vasta sen mukana.
    print(f"Myynnissä {live['attributes']['versionString']} (ei muuteta)")

    if not editable:
        print('Ei muokattavaa versiota: subtitle, kuvaus, avainsanat ja kuvat ohitetaan.')
        return
    print(f"Muokattava versio {editable['attributes']['versionString']}")
    loc = fi_loc(editable)
    attrs = {'description': LISTING['description'], 'keywords': LISTING['keywords'],
             'whatsNew': LISTING['whatsNew']['ios'], 'promotionalText': LISTING['promotionalText']}
    changed = {}
    for k, v in attrs.items():
        show(k, loc['attributes'].get(k), v)
        if (loc['attributes'].get(k) or '') != v:
            changed[k] = v
    if changed:
        patch('appStoreVersionLocalizations', loc['id'], changed)

    infos = req('GET', f'/v1/apps/{APP_ID}/appInfos')['data']
    info = next((i for i in infos if i['attributes'].get('appStoreState') != 'READY_FOR_SALE'), None)
    if info:
        iloc = next(l for l in req('GET', f"/v1/appInfos/{info['id']}/appInfoLocalizations")['data']
                    if l['attributes']['locale'].startswith('fi'))
        show('subtitle', iloc['attributes']['subtitle'], LISTING['subtitle'])
        if iloc['attributes']['subtitle'] != LISTING['subtitle']:
            patch('appInfoLocalizations', iloc['id'], {'subtitle': LISTING['subtitle']})

    if SHOTS:
        files = sorted((ROOT / 'marketing' / 'ios').glob('*.png'))
        sets = req('GET', f"/v1/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets")['data']
        target = next((s for s in sets if s['attributes']['screenshotDisplayType'] == 'APP_IPHONE_67'), None)
        print(f'  ~ kuvat APP_IPHONE_67: {len(files)} uutta')
        if not LIVE:
            return
        if target is None:
            target = req('POST', '/v1/appScreenshotSets', {'data': {
                'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': 'APP_IPHONE_67'},
                'relationships': {'appStoreVersionLocalization': {
                    'data': {'type': 'appStoreVersionLocalizations', 'id': loc['id']}}}}})['data']
        for old in req('GET', f"/v1/appScreenshotSets/{target['id']}/appScreenshots")['data']:
            req('DELETE', f"/v1/appScreenshots/{old['id']}")
        for f in files:
            data = f.read_bytes()
            shot = req('POST', '/v1/appScreenshots', {'data': {
                'type': 'appScreenshots', 'attributes': {'fileName': f.name, 'fileSize': len(data)},
                'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': target['id']}}}}})['data']
            for op in shot['attributes']['uploadOperations']:
                part = data[op['offset']:op['offset'] + op['length']]
                headers = {h['name']: h['value'] for h in op['requestHeaders']}
                r = requests.request(op['method'], op['url'], data=part, headers=headers)
                r.raise_for_status()
            req('PATCH', f"/v1/appScreenshots/{shot['id']}", {'data': {
                'type': 'appScreenshots', 'id': shot['id'],
                'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(data).hexdigest()}}})
            print(f'    ladattu {f.name}')


# ---------------------------------------------------------------- Google Play
class _SkipListing(Exception):
    pass


def play():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    creds = service_account.Credentials.from_service_account_file(
        os.environ['PLAY_KEY_JSON'], scopes=['https://www.googleapis.com/auth/androidpublisher'])
    edits = build('androidpublisher', 'v3', credentials=creds, cache_discovery=False).edits()
    edit = edits.insert(packageName=PACKAGE, body={}).execute()['id']
    try:
        if 'aab' in OPTS:
            track = OPTS.get('track', 'internal')
            print(f"  ~ bundle {OPTS['aab']} → {track}")
            if LIVE:
                code = edits.bundles().upload(
                    packageName=PACKAGE, editId=edit,
                    media_body=MediaFileUpload(OPTS['aab'], mimetype='application/octet-stream', resumable=True),
                ).execute()['versionCode']
                print(f'    versionCode {code}')
                if 'mapping' in OPTS:
                    edits.deobfuscationfiles().upload(
                        packageName=PACKAGE, editId=edit, apkVersionCode=code, deobfuscationFileType='proguard',
                        media_body=MediaFileUpload(OPTS['mapping'], mimetype='application/octet-stream', resumable=True),
                    ).execute()
                    print('    mapping.txt ladattu')
                edits.tracks().update(packageName=PACKAGE, editId=edit, track=track, body={
                    'track': track,
                    'releases': [{
                        'name': OPTS.get('version-name', str(code)), 'versionCodes': [str(code)], 'status': 'completed',
                        'releaseNotes': [{'language': 'fi-FI', 'text': LISTING['whatsNew']['android']}],
                    }],
                }).execute()
        if NO_LISTING:
            raise _SkipListing
        cur = edits.listings().get(packageName=PACKAGE, editId=edit, language='fi-FI').execute()
        show('shortDescription', cur.get('shortDescription'), LISTING['playShortDescription'])
        show('fullDescription', cur.get('fullDescription'), LISTING['description'])
        body = {'language': 'fi-FI', 'title': cur.get('title', 'Koetutka'),
                'shortDescription': LISTING['playShortDescription'], 'fullDescription': LISTING['description']}
        if LIVE:
            edits.listings().update(packageName=PACKAGE, editId=edit, language='fi-FI', body=body).execute()
        if SHOTS:
            files = sorted((ROOT / 'marketing' / 'android').glob('*.png'))
            print(f'  ~ phoneScreenshots: {len(files)} uutta (vanhat poistetaan)')
            if LIVE:
                edits.images().deleteall(packageName=PACKAGE, editId=edit, language='fi-FI',
                                         imageType='phoneScreenshots').execute()
                for f in files:
                    edits.images().upload(packageName=PACKAGE, editId=edit, language='fi-FI',
                                          imageType='phoneScreenshots',
                                          media_body=MediaFileUpload(str(f), mimetype='image/png')).execute()
                    print(f'    ladattu {f.name}')
    except _SkipListing:
        print('  listaus ohitetaan (--no-listing)')
    except BaseException:
        edits.delete(packageName=PACKAGE, editId=edit).execute()
        raise
    try:
        if LIVE:
            edits.commit(packageName=PACKAGE, editId=edit).execute()
            print('  commit tehty')
        else:
            edits.delete(packageName=PACKAGE, editId=edit).execute()
    except BaseException:
        edits.delete(packageName=PACKAGE, editId=edit).execute()
        raise


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else ''
    if target not in ('ios', 'play'):
        raise SystemExit(__doc__)
    print('LIVE' if LIVE else 'Kuivaharjoitus (lisää --live)')
    asc() if target == 'ios' else play()

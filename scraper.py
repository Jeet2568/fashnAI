import os
import time
import requests
from duckduckgo_search import DDGS
import subprocess

DEST_DIR = r'f:\Uphaar\Cypher\Fashion AI\fashn-ai-web\public\uploads'
os.makedirs(DEST_DIR, exist_ok=True)

items = [
    { 'type': 'pose', 'name': 'Hand on Earring', 'query': 'indian fashion model hand on earring portrait photography -stock', 'prompt': 'Medium portrait shot of a beautiful Indian fashion model looking at the camera wearing an elegant dress one hand delicately touching her earring high quality studio editorial portrait' },
    { 'type': 'pose', 'name': 'Hand on Opposite Arm', 'query': 'indian fashion model hand resting on opposite arm wrist portrait photography -stock', 'prompt': 'Medium portrait shot of an Indian fashion model one hand resting elegantly on the opposite wrist soft studio lighting feminine elegant looking directly at the camera' },
    { 'type': 'pose', 'name': 'Over the Shoulder', 'query': 'indian fashion model looking over shoulder back portrait photography -stock', 'prompt': 'Indian fashion model looking over her shoulder back at the camera elegant backless dress high fashion editorial photography soft glowing lighting' },
    { 'type': 'pose', 'name': 'Hands on Hips', 'query': 'indian fashion model hands on hips full body photography clean background -stock', 'prompt': 'Full body shot of an Indian fashion model with both hands resting confidently on her hips strong direct eye contact clean studio background elegant fashion' }
]

def download_image(url, retries=3):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    for _ in range(retries):
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                return r.content
        except Exception as e:
            pass
    return None

def update_db_node(item_type, name, prompt, file_url):
    node_script = f"""
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {{
    const fileUrl = '{file_url}';
    let existing = await prisma.resource.findFirst({{ where: {{ type: '{item_type}', name: '{name}' }} }});
    if (existing) {{
        await prisma.resource.update({{ where: {{ id: existing.id }}, data: {{ thumbnail: fileUrl }} }});
    }} else {{
        await prisma.resource.create({{ data: {{ type: '{item_type}', name: '{name}', prompt: '{prompt}', thumbnail: fileUrl }} }});
    }}
}}
run().then(() => process.exit(0)).catch(console.error);
"""
    with open('temp_seed.js', 'w') as f:
        f.write(node_script)
    subprocess.run(['node', 'temp_seed.js'])

for item in items:
    print('Searching DuckDuckGo for: ' + item['name'])
    try:
        with DDGS() as ddgs:
            results = ddgs.images(
                item['query'],
                safesearch='Off',
                size='Large',
                color='color',
                type_image='photo',
                max_results=3
            )
            for res in results:
                url = res['image']
                print('Downloading: ' + url)
                img_data = download_image(url)
                if img_data:
                    ext = '.jpg'
                    if '.png' in url.lower(): ext = '.png'
                    filename = f"{int(time.time() * 1000)}{ext}"
                    dest_path = os.path.join(DEST_DIR, filename)
                    with open(dest_path, 'wb') as f:
                        f.write(img_data)
                    
                    file_url = f"/uploads/{filename}"
                    update_db_node(item['type'], item['name'], item['prompt'], file_url)
                    print('Seeded ' + item['name'])
                    break
    except Exception as e:
        print('Error on ' + item['name'] + ': ' + str(e))

print('Done!')

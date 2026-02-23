import os
import time
import shutil
import subprocess
from bing_image_downloader import downloader

DEST_DIR = r'f:\Uphaar\Cypher\Fashion AI\fashn-ai-web\public\uploads'
TEMP_DIR = r'f:\Uphaar\Cypher\Fashion AI\fashn-ai-web\temp_bing'
os.makedirs(DEST_DIR, exist_ok=True)

items = [
    { 'type': 'pose', 'name': 'Hand on Earring', 'query': 'indian fashion model hand on earring studio photography', 'prompt': 'Medium portrait shot of a beautiful Indian fashion model looking at the camera wearing an elegant dress one hand delicately touching her earring high quality studio editorial portrait' },
    { 'type': 'pose', 'name': 'Hand on Opposite Arm', 'query': 'indian fashion model posing one hand resting on opposite arm close up', 'prompt': 'Medium portrait shot of an Indian fashion model one hand resting elegantly on the opposite wrist soft studio lighting feminine elegant looking directly at the camera' },
    { 'type': 'pose', 'name': 'Over the Shoulder', 'query': 'indian fashion model looking over shoulder portrait photography', 'prompt': 'Indian fashion model looking over her shoulder back at the camera elegant backless dress high fashion editorial photography soft glowing lighting' },
    { 'type': 'pose', 'name': 'Hands on Hips', 'query': 'indian fashion model hands on hips full body studio photography', 'prompt': 'Full body shot of an Indian fashion model with both hands resting confidently on her hips strong direct eye contact clean studio background elegant fashion' }
]

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
    print('Searching Bing for: ' + item['name'])
    query = item['query']
    try:
        if os.path.exists(TEMP_DIR):
            shutil.rmtree(TEMP_DIR)
            
        downloader.download(query, limit=1,  output_dir=TEMP_DIR, adult_filter_off=False, force_replace=False, timeout=10)
        
        # find downloaded file
        downloaded_folder = os.path.join(TEMP_DIR, query)
        files = os.listdir(downloaded_folder)
        if files:
            source_file = os.path.join(downloaded_folder, files[0])
            ext = os.path.splitext(source_file)[1]
            filename = f"{int(time.time() * 1000)}{ext}"
            dest_path = os.path.join(DEST_DIR, filename)
            shutil.copyfile(source_file, dest_path)
            
            file_url = f"/uploads/{filename}"
            update_db_node(item['type'], item['name'], item['prompt'], file_url)
            print('Seeded ' + item['name'])
        else:
            print('No files found for ' + item['name'])
    except Exception as e:
        print('Error on ' + item['name'] + ': ' + str(e))

print('Done!')

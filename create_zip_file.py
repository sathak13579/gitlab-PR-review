import os
import zipfile

manifest_file_name = 'manifest.json'
zip_file_name = 'gitlab-extension.zip'

with zipfile.ZipFile(zip_file_name, 'w', zipfile.ZIP_DEFLATED) as zip_file:
    zip_file.write(manifest_file_name)
    for folder_name, subfolders, filenames in os.walk('.'):  # Walk through the directory tree
        for filename in filenames:
            if filename.endswith('.js') or filename.endswith('.html') or filename.endswith('.css'):
                file_path = os.path.join(folder_name, filename)
                zip_file.write(file_path)
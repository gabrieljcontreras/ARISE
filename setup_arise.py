import os
from pathlib import Path

def create_arise_structure():
    # Define the directory structure
    folders = [
        "public/assets",
        "src/app/api/capital-one",
        "src/app/api/stats",
        "src/app/api/auth",
        "src/app/dashboard",
        "src/app/profile",
        "src/components/ui",
        "src/components/GameStats",
        "src/lib",
        "src/models",
        "src/styles",
    ]

    # Define initial files with basic boilerplate
    files = {
        "src/lib/mongodb.js": "// MongoDB connection singleton\nimport { MongoClient } from 'mongodb';",
        "src/lib/engine.js": "// ARISE Judgement Engine\nexport const calculateStatChange = (event) => { /* Logic here */ };",
        "src/models/User.js": "// Mongoose Schema for User Stats",
        "src/models/Action.js": "// Schema for Reward/Punishment History",
        "src/styles/globals.css": "@tailwind base;\n@tailwind components;\n@tailwind utilities;",
        ".env.local": "MONGODB_URI=\nCAPITAL_ONE_API_KEY=\nCAPITAL_ONE_SECRET=\nNEXTAUTH_SECRET=",
        "README.md": "# ARISE\nGamify your life. Reward good choices, punish bad ones.",
        ".gitignore": "node_modules\n.env.local\n.next\nout\nbuild"
    }

    print("🚀 Starting ARISE Filesystem Construction...")

    # Create folders
    for folder in folders:
        Path(folder).mkdir(parents=True, exist_ok=True)
        print(f"Created folder: {folder}")

    # Create files
    for file_path, content in files.items():
        with open(file_path, "w") as f:
            f.write(content)
        print(f"Created file: {file_path}")

    print("\n✅ Filesystem ready! Next steps:")
    print("1. Run 'npx create-next-app@latest .' in this folder (select 'No' for src/ and 'Yes' for App Router)")
    print("2. Install dependencies: npm install mongodb mongoose lucide-react framer-motion")

if __name__ == "__main__":
    create_arise_structure()    
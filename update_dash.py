import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Update activeModal type
content = content.replace(
    "const [activeModal, setActiveModal] = useState<'liquid' | 'nutrition' | 'vitals' | 'activity' | 'myplan' | null>(null);",
    "const [activeModal, setActiveModal] = useState<'liquid' | 'nutrition' | 'vitals' | 'activity' | 'myplan' | 'circleOfCare' | 'documents' | 'supportNetwork' | null>(null);"
)

# Replace Ogoo Profile Image
content = content.replace(
    "source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80' }}",
    "source={{ uri: 'Heading_20260320_232324_0000_edit_29127070904564.png' }}"
)

with open("src/App.tsx", "w") as f:
    f.write(content)

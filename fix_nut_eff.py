with open("src/App.tsx", "r") as f:
    content = f.read()

target = """  // Save to local storage
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_liquid'"""

replacement = """  // Save to local storage
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_nutrition', JSON.stringify(nutritionLogs));
  }, [nutritionLogs]);
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_liquid'"""

content = content.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)

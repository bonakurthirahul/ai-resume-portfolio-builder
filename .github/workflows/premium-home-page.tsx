name: Apply Premium Home Page

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  apply:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Replace home page
        run: |
          test -f premium-home-page.tsx
          test -d app
          cp premium-home-page.tsx app/page.tsx
          rm premium-home-page.tsx

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add app/page.tsx premium-home-page.tsx
          git commit -m "Upgrade landing page to professional resume builder UI"
          git push

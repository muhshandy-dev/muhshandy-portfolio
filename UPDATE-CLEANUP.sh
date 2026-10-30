#!/bin/sh
# Remove only stale original demo content / unused files after overlay installation.
set -eu
if [ ! -f src/data/site.json ]; then echo "Jalankan dari folder portfolio-saya"; exit 1; fi
rm -f src/data/resume.tsx
rm -f src/app/blog/opengraph-image.tsx src/app/blog/\[slug\]/opengraph-image.tsx
rm -f src/components/section/contact-section.tsx src/components/section/hackathons-section.tsx src/components/section/projects-section.tsx src/components/section/work-section.tsx
printf 'Sisa komponen demo lama telah dibersihkan. Data yang baru ada di src/data/site.json.\n'

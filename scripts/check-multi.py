import re
data = open('shared/concepts.js').read()
entries = re.findall(r"'([^']+)':\{href:withHash\('([^']+)'", data)
print(f"Total entries: {len(entries)}")

from collections import defaultdict
by_url = defaultdict(list)
for name, url in entries:
    by_url[url].append(name)

multi = {url:names for url,names in by_url.items() if len(names) > 1}
print(f"Multi-concept lessons: {len(multi)}")
for url,names in sorted(multi.items(), key=lambda x:-len(x[1])):
    print(f"  {', '.join(names)}  -> {url}")

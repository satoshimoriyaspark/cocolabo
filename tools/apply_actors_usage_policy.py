from pathlib import Path
from lxml import html
import json,re,urllib.parse,posixpath

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'actors'
UNUSED={'about','flow','gallery','specialschool','springschool','blog'}

def unused(path):
    bits=path.strip('/').split('/')
    if bits and bits[0]=='actors':bits=bits[1:]
    return bool(bits and (bits[0] in UNUSED or re.fullmatch(r'20\d\d',bits[0])))

changed=[];removed=0;inactive=0
for file in sorted(SITE.rglob('*.html')):
    tree=html.fromstring(file.read_text())
    base=tree.xpath('//base/@href')[0]
    page_unused=unused(file.relative_to(ROOT).as_posix())
    if page_unused:
        inactive+=1
        banners=tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," status ")]')
        for banner in banners:
            banner.text='未使用ページ — 移管先の案内からは外し、本文データを保管しています。'
    for a in list(tree.xpath('//a[@href]')):
        href=a.get('href');u=urllib.parse.urlsplit(urllib.parse.urljoin('https://cocolabo.vercel.app'+base,href))
        if u.hostname not in {'cocolabo.vercel.app','hinata-actors-school.com','www.hinata-actors-school.com'}:continue
        if not unused(u.path):continue
        removed+=1
        parent=a.getparent()
        if parent is not None and parent.tag=='li' and len(parent.xpath('.//a'))==1:parent.drop_tree()
        else:a.drop_tree()
    for li in tree.xpath('//li[not(normalize-space()) and not(.//img)]'):li.drop_tree()
    result=html.tostring(tree,encoding='unicode',method='html',doctype='<!doctype html>')
    file.write_text(result)
    changed.append({'path':file.relative_to(ROOT).as_posix(),'mode':'100644','type':'blob','content':result})

# Check all active-page links against the explicit unused classification.
for file in SITE.rglob('*.html'):
    if unused(file.relative_to(ROOT).as_posix()):continue
    tree=html.fromstring(file.read_text());base=tree.xpath('//base/@href')[0]
    for a in tree.xpath('//a[@href]'):
        u=urllib.parse.urlsplit(urllib.parse.urljoin('https://cocolabo.vercel.app'+base,a.get('href')))
        assert u.hostname not in {'cocolabo.vercel.app','hinata-actors-school.com','www.hinata-actors-school.com'} or not unused(u.path), (file,a.get('href'))
policy={'active_html_pages':len(changed)-inactive,'unused_html_pages':inactive,'unused_fixed_pages':sorted(UNUSED-{'blog'}),'blog':'Listing and all 46 articles unused; incoming links removed; source retained','missing_active_pages':['for-parent','message'],'removed_links':removed}
report=ROOT/'actors-usage-policy.json';report.write_text(json.dumps(policy,ensure_ascii=False,indent=2)+'\n')
changed.append({'path':'actors-usage-policy.json','mode':'100644','type':'blob','content':report.read_text()})
changed.append({'path':'tools/apply_actors_usage_policy.py','mode':'100644','type':'blob','content':Path(__file__).read_text().replace("ROOT=Path(__file__).resolve().parents[1]","ROOT=Path(__file__).resolve().parents[1]s[1]")})
Path('/tmp/actors-usage-tree.json').write_text(json.dumps(changed,ensure_ascii=False))
print(json.dumps({**policy,'tree_characters':len(Path('/tmp/actors-usage-tree.json').read_text())},ensure_ascii=False))

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const originalNavigationCss = 'nav{position:sticky;top:0;background:#07121de8;padding:10px 0;z-index:2}nav a{display:block;color:#e6bf78;margin:0 10px 6px 0}';
const compactNavigationCss = 'nav.jump-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;min-height:54px;box-sizing:border-box;padding:8px 12px;background:#07121df0;border:1px solid #796540;box-shadow:0 8px 20px #0008}nav.jump-bar label{white-space:nowrap;color:#e6bf78;font-weight:600}nav.jump-bar select{min-width:0;max-width:440px;width:100%;padding:8px 10px;border:1px solid #aa8751;border-radius:3px;background:#101e2c;color:#f4e8cd;font:inherit}nav.jump-bar span{margin-left:auto;white-space:nowrap;color:#b9c3ca}@media(max-width:600px){nav.jump-bar{gap:8px}nav.jump-bar span{display:none}}';

export function compactGalleryNavigation(html) {
  if (html.includes('class="jump-bar"')) return html;
  const navigation = html.match(/<nav>([\s\S]*?)<\/nav>/);
  if (!navigation || !html.includes(originalNavigationCss)) throw new Error('Gallery navigation template changed');
  const links = [...navigation[1].matchAll(/<a href="#([^"]+)">([^<]+)<\/a>/g)];
  if (!links.length) throw new Error('Gallery has no dialogue links');
  const options = links.map(([, id, label]) => '<option value="' + id + '">' + label + '</option>').join('');
  const bar = '<nav class="jump-bar" aria-label="Navigation des dialogues"><label for="dialogue-jump">Dialogue</label><select id="dialogue-jump"><option value="">Choisir un dialogue...</option>' + options + '</select><span>' + links.length + ' dialogues</span></nav>';
  const script = '<script>const jump=document.getElementById("dialogue-jump");function syncJump(){jump.value=decodeURIComponent(location.hash.slice(1))}syncJump();jump.addEventListener("change",()=>{if(jump.value)location.hash="#"+jump.value});addEventListener("hashchange",syncJump);</script>';
  return html
    .replace(originalNavigationCss, compactNavigationCss)
    .replace('section{border-top:', 'section{scroll-margin-top:70px;border-top:')
    .replace(navigation[0], bar)
    .replace('desktop captures.', 'captures.')
    .replace('</body></html>', script + '</body></html>');
}

if (process.argv.includes('--apply')) {
  const galleryPath = fileURLToPath(new URL('../../docs/reports/dialogue-static-tableau-v2-review/gallery.html', import.meta.url));
  await writeFile(galleryPath, compactGalleryNavigation(await readFile(galleryPath, 'utf8')));
  process.stdout.write('Updated ' + galleryPath + '\n');
}

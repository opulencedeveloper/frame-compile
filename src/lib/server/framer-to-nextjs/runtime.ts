import framerConfig from "./config";
import { IImageVariantManifest } from "./interface";

// Runs before any of Framer's code on a converted page. It makes the
// mirrored files behave as they did on Framer's CDN:
//
// 1. URL: Framer's runtime calls `new URL(src)` on image and data URLs,
//    some without a try/catch. Mirrored URLs are root-relative, which
//    `new URL` rejects without a base, so they are resolved against the
//    page's origin, as a browser does for an <img src>.
//
// 2. fetch: Framer's CMS reads its data files with `?range=0-99,200-299`,
//    and Framer's CDN answers with just those bytes joined together. A
//    static host ignores the query and returns the whole file, which the
//    runtime rejects. The file is fetched once and the ranges are cut from
//    it here instead, so CMS pages work on any static host.
//
// 3. Images: pages already point at the captured image sizes, but Framer's
//    runtime also builds image URLs while it runs ("x.png?scale-down-to=N").
//    Those are mapped onto the smallest captured size that is at least N, or
//    the full-size variant. With no suitable size the URL is left as it is
//    and the host serves the original file.
const IMAGE_SHIM = `(function(){
var I=__IMAGES__,O=location.origin,N=window.URL;
function v(s){
if(typeof s!=="string"||s.indexOf("?")<0)return s;
var u;try{u=new N(s,location.href)}catch(e){return s}
if(u.origin!==O||u.pathname.indexOf(I.directory)!==0)return s;
var n=u.pathname.slice(I.directory.length),z=I.sizes[n];if(!z)return s;
var w=0,ok=true;u.searchParams.forEach(function(x,k){if(k===I.sizeParam)w=+x;else if(I.descriptiveParams.indexOf(k)<0)ok=false});
if(!ok||!(w>=0))return s;
var c=-1;for(var i=0;i<z.length;i++)if(z[i]===0||(w>0&&z[i]>=w)){c=z[i];break}
if(c<0)return s;
return I.directory+n.slice(0,n.lastIndexOf("."))+"-"+(c?c+I.sizeSuffix:I.fullSizeSuffix)+I.extension}
function vs(s){return typeof s==="string"?s.replace(/(^|,)(\\s*)([^\\s,]+)/g,function(m,a,b,u){return a+b+v(u)}):s}
var A=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(n,x){var t=this.tagName;if(t==="IMG"||t==="SOURCE"||t==="LINK"){var l=String(n).toLowerCase();if(l==="src"||l==="href")x=v(x);else if(l==="srcset"||l==="imagesrcset")x=vs(x)}return A.call(this,n,x)};
function H(C,p,f){var d=C&&Object.getOwnPropertyDescriptor(C.prototype,p);if(d&&d.set)Object.defineProperty(C.prototype,p,{configurable:true,enumerable:d.enumerable,get:d.get,set:function(x){d.set.call(this,f(x))}})}
H(window.HTMLImageElement,"src",v);H(window.HTMLImageElement,"srcset",vs);H(window.HTMLSourceElement,"src",v);H(window.HTMLSourceElement,"srcset",vs);
})();`;

const RUNTIME_SHIM = `(function(){
var P=__PREFIXES__,O=location.origin,N=window.URL,F=window.fetch,C={};
function m(v){if(typeof v!=="string")return false;for(var i=0;i<P.length;i++)if(v.indexOf(P[i])===0)return true;return false}
window.URL=new Proxy(N,{construct:function(t,a,n){a=Array.prototype.slice.call(a);if(m(a[1]))a[1]=O+a[1];else if(a[1]===undefined&&m(a[0]))a[1]=O;return Reflect.construct(t,a,n)}});
window.fetch=function(i){
var u;try{u=new N(i instanceof Request?i.url:String(i),location.href)}catch(e){return F.apply(this,arguments)}
var r=u.origin===O&&/\\.framercms$/.test(u.pathname)?u.searchParams.get("range"):null;
if(!r)return F.apply(this,arguments);
var k=u.pathname;
if(!C[k])C[k]=F.call(window,k).then(function(s){if(!s.ok)throw new Error("HTTP "+s.status+" for "+k);return s.arrayBuffer()}).catch(function(e){delete C[k];throw e});
return C[k].then(function(b){
var s=r.split(","),c=[],n=0,j;
for(j=0;j<s.length;j++){var x=s[j].split("-"),a=+x[0],z=+x[1]+1;if(!(a>=0&&z>a&&z<=b.byteLength))return new Response(null,{status:416});c.push(new Uint8Array(b,a,z-a));n+=z-a}
var o=new Uint8Array(n),p=0;for(j=0;j<c.length;j++){o.set(c[j],p);p+=c[j].length}
return new Response(o,{status:200,headers:{"content-type":"application/octet-stream"}})})};
})();`;

// "<" could close the <script> tag early; U+2028 and U+2029 end a line in
// older JavaScript engines.
const SCRIPT_UNSAFE_CHARACTERS = new RegExp("[<\\u2028\\u2029]", "g");

// Hides the "Made in Framer" badge even if its module wasn't recognised
// and replaced (see FramerSite.badgeModuleUrl).
const BADGE_STYLE = "#__framer-badge-container{display:none!important}";

class RuntimeFiles {
  // Injected at the top of every page's <head>.
  // `servedPrefixes` are the paths mirrored files are served under.
  public headTags(servedPrefixes: string[], images: IImageVariantManifest): string {
    let shim = RUNTIME_SHIM.replace("__PREFIXES__", this.scriptJson(servedPrefixes));
    if (Object.keys(images.sizes).length > 0) {
      const settings = framerConfig.imageVariants;
      shim += IMAGE_SHIM.replace(
        "__IMAGES__",
        this.scriptJson({
          directory: images.directory,
          sizes: images.sizes,
          sizeParam: settings.sizeParam,
          descriptiveParams: settings.descriptiveParams,
          sizeSuffix: settings.sizeSuffix,
          fullSizeSuffix: settings.fullSizeSuffix,
          extension: settings.fileExtension,
        }),
      );
    }
    return (
      `<script data-framecompile="runtime">${shim}</script>` +
      `<style data-framecompile="badge">${BADGE_STYLE}</style>`
    );
  }

  public badgeStyle(): string {
    return BADGE_STYLE;
  }

  public editorStubPath(): string {
    return `${framerConfig.runtimeDir}${framerConfig.editorStubFile}`;
  }

  // Framer's entry module imports the editor bar and calls createEditorBar().
  public editorStub(): string {
    return "export const createEditorBar=()=>()=>null;export default createEditorBar;\n";
  }

  // The badge is a lazy component hydrated into its own React root. A
  // module that never finishes loading keeps that root's Suspense boundary
  // dehydrated: React leaves the server markup (emptied of the badge) as it
  // is and never compares it with a render. Rendering anything, even null,
  // fails hydration there, and that root has no handler for the error.
  public badgeStub(): string {
    return "await new Promise(()=>{});export default function FramerBadge(){return null}\n";
  }

  // JSON that is safe inside an inline <script>: file names come from the
  // site being converted, and "</script>" in one would end the tag early.
  private scriptJson(value: unknown): string {
    return JSON.stringify(value).replace(
      SCRIPT_UNSAFE_CHARACTERS,
      (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
  }
}

export const runtimeFiles = new RuntimeFiles();

import{b6 as l}from"./index-ccj63IoK.js";function h(s,c,u,o,n,r=0,t=0){if(t<=0)return[s+u*n,c+o*n+.5*r*n*n];const f=(1-Math.exp(-t*n))/t,a=r/t;return[s+u*f,c+a*n+(o-a)*f]}function x(s,c,u,o,n,r){for(let t=0;t<u;t++){const f=l(o,t,911),a=f.next()*c,e=typeof n=="function"?n(f):n;let b=((s-a)%c+c)%c;for(;b<e;b+=c)r(b,e,l(o,t),t)}}export{x as c,h as f};
//# sourceMappingURL=particles-BjxNInyF.js.map

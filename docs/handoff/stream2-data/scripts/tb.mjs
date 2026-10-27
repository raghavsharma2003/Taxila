import { workTrayBox } from "/home/user/Taxila/src/child/lesson/trayBox.ts";
for (const [w,h] of [[360,800],[412,915],[1366,768]]) for (const f of ["older","young"]) console.log(w,h,f, JSON.stringify(workTrayBox({w,h},f)), JSON.stringify(workTrayBox({w,h},f,{play:true})));

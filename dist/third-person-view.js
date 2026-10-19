// Camera coordinates are render units (one tenth of simulation units).
export function thirdPersonView(p,view,aspect=16/9){
 const yaw=view.yaw,pitch=view.pitch,distance=view.aiming?9:14,side=(view.aiming?1.8:3.3)*Math.min(1,Math.max(.3,aspect/1.4));
 const pivot={x:p.x*.1,y:(p.altitude||0)*.1+4.8,z:p.y*.1};
 const position={x:pivot.x-Math.cos(yaw)*Math.cos(pitch)*distance-Math.sin(yaw)*side,y:Math.max(1.4,pivot.y+2-Math.sin(pitch)*distance),z:pivot.z-Math.sin(yaw)*Math.cos(pitch)*distance+Math.cos(yaw)*side};
 return{pivot,position,direction:{x:Math.cos(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:Math.sin(yaw)*Math.cos(pitch)},fov:view.aiming?44:p.boosting?80:72};
}

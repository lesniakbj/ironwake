import * as T from './vendor/three.module.min.js';
import {impactLevel} from './impact-preferences.js';

const MAX_HITS=28,SPARKS=8;
const PALETTE={precision:'#fff0a0',melee:'#a4ffff',blade:'#a4ffff',bladeWave:'#a4ffff',hammer:'#d7a5ff',lance:'#b0f5ff',claws:'#a4ffff',scythe:'#a4ffff',phaser:'#91ffc5',plasma:'#d2a2ff',overload:'#d2a2ff',scatter:'#e2b8ff',rotary:'#ff8195',carbine:'#9df6ff',rail:'#adf7ff',dynamo:'#ffe591'};
export function burstGeometry(spikes=9){
  const vertices=[];
  for(let i=0;i<spikes*2;i++){
    const a=i*Math.PI/spikes,b=(i+1)*Math.PI/spikes;
    const radius=j=>j%2?.19:1-(j%6)*.065;
    vertices.push(0,0,0,Math.cos(a)*radius(i),Math.sin(a)*radius(i),0,Math.cos(b)*radius(i+1),Math.sin(b)*radius(i+1),0);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));return geometry;
}
export function addMuzzleBurst(parent,color){
  const geometry=burstGeometry(7),materials=[
    new T.MeshBasicMaterial({color:'#101524',side:T.DoubleSide,depthWrite:false}),
    new T.MeshBasicMaterial({color,side:T.DoubleSide,depthWrite:false}),
    new T.MeshBasicMaterial({color:'#fffbe8',side:T.DoubleSide,depthWrite:false})
  ];
  materials.forEach((material,i)=>{
    const mesh=new T.Mesh(geometry,material);mesh.position.z=-.26-i*.015;mesh.scale.setScalar([1.15,.97,.55][i]);mesh.rotation.z=i*.18;parent.add(mesh);
  });
  parent.userData.disposeBurst=()=>{geometry.dispose();materials.forEach(m=>m.dispose());};
}

// Hits share three draw calls and use replicated simulation events on every client.
export function createImpactPool(parent){
  const star=burstGeometry(),shard=new T.ConeGeometry(1,1,4),stamp=new T.Object3D(),tint=new T.Color(),axis=new T.Vector3(0,1,0),direction=new T.Vector3(),local=new T.Vector3();
  const make=(geometry,count,color)=>{const mesh=new T.InstancedMesh(geometry,new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:1,depthWrite:false}),count);mesh.frustumCulled=false;mesh.count=0;parent.add(mesh);return mesh;};
  const ink=make(star,MAX_HITS,'#0e1420'),cores=make(star,MAX_HITS,'#ffffff'),sparks=make(shard,MAX_HITS*SPARKS,'#ffffff');
  return {
    update(events,camera){
      let hits=0,pieces=0;const level=impactLevel();camera.getWorldDirection(direction);
      for(let i=events.length-1;i>=0&&hits<MAX_HITS;i--){
        const event=events[i],age=Math.max(0,1-event.life);
        if(age>.28||event.kind==='burn'||(event.kind==='phaser'&&event.id%3))continue;
        const fade=Math.max(0,1-age/.28),power=Math.min(2.4,.65+Math.sqrt(event.amount||20)/13),reach=(1-Math.exp(-age*30))*power;
        const x=event.x*.1,y=((event.z??65)-28)*.1,z=event.y*.1;
        tint.set(PALETTE[event.kind]||'#ffd59b');
        stamp.position.set(x,y,z);stamp.quaternion.copy(camera.quaternion);stamp.rotateZ(event.id*2.399);
        const size=power*(age<.045?1.45:Math.max(.01,1-age/.19))*(.65+level*.35);
        stamp.scale.set(size*1.3,size,.01);stamp.updateMatrix();ink.setMatrixAt(hits,stamp.matrix);
        stamp.position.addScaledVector(direction,-.025);stamp.scale.multiplyScalar(.72);stamp.updateMatrix();cores.setMatrixAt(hits,stamp.matrix);cores.setColorAt(hits,tint);hits++;
        for(let j=0;j<SPARKS;j++){
          const angle=j*Math.PI*2/SPARKS+event.id*.7;
          local.set(Math.cos(angle),Math.sin(angle),.12*Math.sin(j*7)).applyQuaternion(camera.quaternion);
          stamp.position.set(x,y,z).addScaledVector(local,reach*(1+j%3*.4));stamp.quaternion.setFromUnitVectors(axis,local.normalize());
          const width=.045*power*fade*level;
          stamp.scale.set(width,Math.max(.01,fade*power*(j%2?.7:1.4)),width);stamp.updateMatrix();sparks.setMatrixAt(pieces,stamp.matrix);sparks.setColorAt(pieces,tint);pieces++;
        }
      }
      for(const [mesh,count]of[[ink,hits],[cores,hits],[sparks,pieces]]){mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
    },
    dispose(){for(const mesh of[ink,cores,sparks]){mesh.removeFromParent();mesh.material.dispose();mesh.dispose();}star.dispose();shard.dispose();}
  };
}

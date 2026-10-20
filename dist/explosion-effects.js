import * as T from './vendor/three.module.min.js';
import {impactLevel} from './impact-preferences.js';

const MAX_BURSTS=18,FIRE=12,CLOUDS=10,SPARKS=18;
// Ink, hot core, smoke, debris and pressure arcs batch across all explosions.
export function createExplosionPool(parent){
  const rock=new T.IcosahedronGeometry(1,0),arc=new T.RingGeometry(.91,1,24,1,0,Math.PI*.7),stamp=new T.Object3D(),direction=new T.Vector3(),up=new T.Vector3(0,1,0),color=new T.Color();
  function layer(geometry,count,opacity=1){
    const material=new T.MeshBasicMaterial({color:'#ffffff',transparent:opacity<1,opacity,side:T.DoubleSide,depthWrite:false});
    const mesh=new T.InstancedMesh(geometry,material,count);mesh.frustumCulled=false;mesh.count=0;parent.add(mesh);return mesh;
  }
  const ink=layer(rock,MAX_BURSTS*FIRE),fire=layer(rock,MAX_BURSTS*FIRE),cloud=layer(rock,MAX_BURSTS*CLOUDS,.46),sparks=layer(rock,MAX_BURSTS*SPARKS),pressure=layer(arc,MAX_BURSTS*3,.65);
  pressure.material.blending=T.AdditiveBlending;
  const put=(mesh,index,tint)=>{stamp.updateMatrix();mesh.setMatrixAt(index,stamp.matrix);color.set(tint);mesh.setColorAt(index,color);};
  return {
    update(events){
      let flames=0,smoke=0,shards=0,arcs=0,bursts=0;const level=impactLevel();cloud.material.opacity=.25+level*.21;
      for(let i=events.length-1;i>=0&&bursts<MAX_BURSTS;i--){
        const e=events[i];if(e.kind!=='explosion')continue;bursts++;
        const max=Math.max(.01,e.max||.8),age=Math.max(0,max-e.life),progress=Math.min(1,age/max),fade=1-progress;
        const plasma=e.weapon==='plasma',radius=Math.max(.5,e.r*.1),spread=1-Math.exp(-age*15),seed=e.id||0;
        const x=e.x*.1,y=Math.max(.25,(e.z||0)*.1),z=e.y*.1;
        for(let j=0;j<FIRE;j++){
          const angle=j*2.39996+seed*.71,lift=Math.sin(j*6.73+seed)*.65;
          direction.set(Math.cos(angle),lift,Math.sin(angle)).normalize();
          stamp.position.set(x,y,z).addScaledVector(direction,radius*spread*(j===0?0:.18+(j%4)*.12));
          stamp.rotation.set(angle,age*(j%2?2:-2),angle*.3);
          const size=radius*(j===0?.52:.27)*Math.max(.05,spread)*Math.pow(fade,.8)*(j%2?.88:1.12)*(.8+level*.2);
          stamp.scale.set(size*1.14,size*(plasma?.8:1.2)*1.14,size*1.14);put(ink,flames,'#17202c');
          stamp.scale.multiplyScalar(.86);put(fire,flames,age<.06?'#fffbe6':plasma?(j%3?'#b17dff':'#f2caff'):age<.19?(j%3?'#ffdf86':'#fff6ce'):(j%3?'#f57639':'#ffb64f'));flames++;
        }
        // Smoke animates on twos, with a stepped, drawn-cel silhouette.
        const celAge=Math.floor(age*24)/24;
        for(let j=0;j<CLOUDS;j++){
          const angle=j*2.39996+seed*.6,reach=radius*(.3+progress*.5);
          stamp.position.set(x+Math.cos(angle)*reach,y+celAge*radius*(.3+j%3*.1),z+Math.sin(angle)*reach);
          stamp.rotation.set(angle,celAge*(j%2?1:-1),angle*.3);
          const size=radius*(.1+progress*.18)*Math.sin(progress*Math.PI)*(.9+j%3*.15);
          stamp.scale.set(size,size*.85,size);put(cloud,smoke,plasma?(j%2?'#4e385d':'#78628b'):(j%2?'#293340':'#58636b'));smoke++;
        }
        for(let j=0;j<SPARKS;j++){
          const angle=j*2.399+seed;
          direction.set(Math.cos(angle),.15+(j%5)*.23,Math.sin(angle)).normalize();
          stamp.position.set(x,y,z).addScaledVector(direction,radius*spread*(.5+(j%6)*.13));stamp.position.y-=age*age*radius*.65;
          stamp.quaternion.setFromUnitVectors(up,direction);
          const width=radius*.014*fade*level;
          stamp.scale.set(width,width*(j%3?11:20),width);put(sparks,shards,plasma?'#e4c9ff':j%3?'#ffd58a':'#17202c');shards++;
        }
        for(let j=0;j<3;j++){
          stamp.position.set(x,Math.max(.18,y-radius*.15)+j*.06,z);stamp.rotation.set(-Math.PI/2,0,j*Math.PI*.7+seed);
          stamp.scale.setScalar(Math.max(.01,radius*(.15+spread*.92)*(1-progress*.35)));put(pressure,arcs,plasma?'#cbaaff':'#f4d4a2');color.multiplyScalar(fade*level);pressure.setColorAt(arcs,color);arcs++;
        }
      }
      for(const [mesh,count]of[[ink,flames],[fire,flames],[cloud,smoke],[sparks,shards],[pressure,arcs]]){mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
    },
    dispose(){for(const mesh of[ink,fire,cloud,sparks,pressure]){mesh.removeFromParent();mesh.material.dispose();mesh.dispose();}rock.dispose();arc.dispose();}
  };
}

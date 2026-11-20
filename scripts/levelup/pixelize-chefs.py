from PIL import Image
import numpy as np, sys
CANVAS=(128,144)
specs={  # file: (crop box, pixel size, shadow center x, shadow bottom y)
 1:((40,40,215,440),3.5,126.5,434), 2:((40,440,215,805),3.25,125.5,798),
 3:((40,40,215,440),3.5,126.5,435), 4:((40,40,215,440),3.5,126.5,434),
 5:((170,130,770,1040),8.1,459,1034), 6:((170,130,770,1040),8.1,459,1034)}
out=[]
for i,(box,px,cx,by) in specs.items():
    im=Image.open(f's{i}.jpg').convert('RGB').crop(box)
    w,h=im.size; gw,gh=round(w/px),round(h/px)
    small=im.resize((gw,gh),Image.BOX)
    a=np.asarray(small).astype(int)
    bg=np.asarray(Image.open(f's{i}.jpg').convert('RGB')).astype(int)[5,5]
    mask=np.abs(a-bg).sum(2)>36
    q=small.quantize(64,method=Image.MEDIANCUT).convert('RGBA')
    arr=np.asarray(q).copy(); arr[~mask,3]=0
    spr=Image.fromarray(arr)
    can=Image.new('RGBA',CANVAS,(0,0,0,0))
    ox=round(CANVAS[0]/2-(cx-box[0])/px); oy=round(CANVAS[1]-2-(by-box[1])/px)
    can.alpha_composite(spr,(ox,oy)) if ox>=0 and oy>=0 else can.paste(spr,(ox,oy),spr)
    can.save(f'chef-{i}.png'); out.append(can)
sheet=Image.new('RGBA',(CANVAS[0]*6,CANVAS[1]),(247,243,234,255))
for k,c in enumerate(out): sheet.alpha_composite(c,(k*CANVAS[0],0))
sheet.resize((sheet.width*2,sheet.height*2),Image.NEAREST).save('preview.png')

import sys
from PIL import Image,ImageDraw
d0=sys.argv[1]
def sheet(names,box,out,cols=4):
  w,h=box[2]-box[0],box[3]-box[1]
  S=Image.new('RGB',(w*cols,h*((len(names)+cols-1)//cols)),'white');d=ImageDraw.Draw(S)
  for i,n in enumerate(names):
    im=Image.open(f'{d0}/{n}.png').convert('RGB').crop(box); S.paste(im,((i%cols)*w,(i//cols)*h)); d.text(((i%cols)*w+4,(i//cols)*h+4),n,fill=(0,0,0))
  S.save(out)
sheet(['talk_aa','talk_O','talk_E','talk_U','talk_PP','talk_FF','tongue_DD_tipUp','tongue_retroflex','tongue_TH','tongue_L','live_jaw_only','rest'],(420,540,640,690),d0+'_mouth.png')
sheet(['delight','delight_crescent','concern','surprise','playful','listening','thinking','yaw_m20','yaw_p20','pitch_down','gaze_right','blink_mid'],(150,60,900,800),d0+'_expr.png')

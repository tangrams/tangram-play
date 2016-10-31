// Take a video capture and save to file
import { saveAs } from 'file-saver';
import { tangramLayer } from './map';

let isCapturing = false;

export function startVideoCapture() {
  if (!isCapturing) {
    if (tangramLayer.scene.startVideoCapture()) {
      isCapturing = true;
    }
  } else {
    tangramLayer.scene.stopVideoCapture().then((video) => {
      isCapturing = false;
      saveAs(video.blob, `tangram-video-${+new Date()}.webm`);
    });
  }
}

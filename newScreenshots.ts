/* 
    版本2.0
    这个是截图完整的版本
    这个版本用的是MediaProjection，是安卓中用于截图和投屏的API，
    安卓10及之后的版本中，使用这个API需要在Manifest中请求相应的service，
    所以这个方法不能在10以上版本使用。
*/
console.log('!!!!!!  this is version 2.0  !!!!!!');
Java.perform(function () {
    // 声明一堆要用到的包装器
    var fragmentActivity_wrapper: Java.Wrapper = Java.use('androidx.fragment.app.FragmentActivity');
    var mediaProjectionManager_wrapper: Java.Wrapper = Java.use('android.media.projection.MediaProjectionManager');
    var displayMetrics_wrapper: Java.Wrapper = Java.use('android.util.DisplayMetrics');
    var windowManager_wrapper: Java.Wrapper = Java.use('android.view.WindowManager');
    var imageReader_wrapper: Java.Wrapper = Java.use('android.media.ImageReader');
    var bitmap_wrapper: Java.Wrapper = Java.use('android.graphics.Bitmap');
    var config_wrapper: Java.Wrapper = Java.use('android.graphics.Bitmap$Config');
    var file_wrapper: Java.Wrapper = Java.use('java.io.File');
    var fileOutputStream_wrapper: Java.Wrapper = Java.use('java.io.FileOutputStream');
    var compressFormat_wrapper: Java.Wrapper = Java.use('android.graphics.Bitmap$CompressFormat');
    var activity_wrapper: Java.Wrapper = Java.use('android.app.Activity');

    // 用到的全局变量
    const EVENT_SCREENSHOT = 22;//截图事件
    const RESULT_OK = -1;
    var mediaProjectionManager: any;
    var mediaProjection: any;
    var image: any;
    var mainActivityName: string = '';
    var curentActivityInstance: any;
    var pictureName: string;

    // hook "onResume"
    fragmentActivity_wrapper.onResume.implementation = function () {
        console.log('------hook "onResume" success------');
        mainActivityName = this.$className;
        console.log('get activity name: ' + mainActivityName);
        curentActivityInstance = Java.cast(this, activity_wrapper);
        console.log('get activity instance: ' + curentActivityInstance);
        Java.use(mainActivityName).onActivityResult.implementation = function (requestCode: number, resultCode: any, data: any) {
            // 如果是截图事件，就由配套的来处理。
            if (requestCode === EVENT_SCREENSHOT && resultCode === RESULT_OK) {
                onActivityResult(requestCode, resultCode, data);
            }
            // 否者由应用自身处理。
            else {
                this.onActivityResult(requestCode, resultCode, data);
            }
        };
        this.onResume();
        console.log('------end of invoke "onResume"-----');
    };
    // 启动截图
    function takeScreenshot(name: string) {
        pictureName = name;
        console.log('screenshot use instance: ' + curentActivityInstance);
        mediaProjectionManager = Java.cast(curentActivityInstance.getApplication().getSystemService('media_projection'),
            mediaProjectionManager_wrapper);
        // launch system service
        curentActivityInstance.startActivityForResult(mediaProjectionManager.createScreenCaptureIntent(), EVENT_SCREENSHOT);
    }
    // 添加的onActivityResult，用于处理送回的截图。
    function onActivityResult(requestCode: number, resultCode: any, data: any) {
        console.log("captureScreen...");
        var displayMetrics = displayMetrics_wrapper.$new();
        var windowManager = Java.cast(curentActivityInstance.getSystemService('window'), windowManager_wrapper);
        windowManager.getDefaultDisplay().getMetrics(displayMetrics);
        var width: any = displayMetrics.widthPixels.value;
        var height: any = displayMetrics.heightPixels.value;
        console.log("displayMetrics width=" + width + ", height=" + height);
        var mImageReader = imageReader_wrapper.newInstance(width, height, 1, 2);
        mediaProjection = mediaProjectionManager.getMediaProjection(resultCode, data);
        var virtualDisplay = mediaProjection.createVirtualDisplay("screen-mirror", width, height,
            displayMetrics.densityDpi.value, 16, mImageReader.getSurface(), null, null);
        // 这里必须用等待的方法。
        setTimeout(function () {
            try {
                image = mImageReader.acquireLatestImage();
                console.log('get image: ' + image.toString());
                if (image !== null) {
                    var planes = image.getPlanes();
                    var buffer = planes[0].getBuffer();
                    var width = image.getWidth();
                    var height = image.getHeight();
                    console.log("image width=" + width + ", height=" + height);
                    var pixelStride = planes[0].getPixelStride();
                    var rowStride = planes[0].getRowStride();
                    var rowPadding = rowStride - pixelStride * width;
                    var bitmap = bitmap_wrapper.createBitmap(width + rowPadding / pixelStride, height, config_wrapper.ARGB_8888.value);
                    bitmap.copyPixelsFromBuffer(buffer);
                    bitmap = bitmap_wrapper.createScaledBitmap(bitmap, bitmap.getWidth(), bitmap.getHeight(), false);
                    if (bitmap != null) {
                        console.log("屏幕截图成功!");
                        saveBitmap(pictureName + '.jpeg', bitmap, curentActivityInstance);
                        bitmap.recycle();
                    }
                }
            } catch (e: any) {
                console.log("截图出现异常：" + e.toString());
            } finally {
                if (image !== null) {
                    image.close();
                }
                if (mImageReader !== null) {
                    mImageReader.close();
                }
                if (virtualDisplay !== null) {
                    virtualDisplay.release();
                }
                //必须代码，否则出现BufferQueueProducer: [ImageReader] dequeueBuffer: BufferQueue has been abandoned
                mImageReader.setOnImageAvailableListener(null, null);
                mediaProjection.stop();
            }
        }
            , 100);

    }
    // 保存Bitmap
    function saveBitmap(name: string, bitmap: any, instance: { getFilesDir: () => { (): any; new(): any; toString: { (): string; new(): any; }; }; compress: (arg0: any, arg1: number, arg2: any) => any; }) {
        try {
            // 获取文件保存路径
            var targetPath = instance.getFilesDir().toString() + '/images';
            var filePath = file_wrapper.$new(targetPath);
            if (!filePath.exists()) {
                filePath.mkdirs();
            }
            var saveFile = file_wrapper.$new(targetPath, name);

            var stream = fileOutputStream_wrapper.$new(saveFile);
            // 将Bitmap压缩写入流
            bitmap.compress(compressFormat_wrapper.JPEG.value, 80, stream);
            //存储完成后需要清除相关的进程
            stream.flush();
            console.log('success save screenshots: ' + saveFile.toString());
        } catch (error: any) {
            console.log('error in saveBitmap' + error.toString());
        } finally {
            if (stream !== null) {
                stream.close();
            }
        }
    }
    // rpc导出，和功能无关。
    rpc.exports = {
        shot() {
            takeScreenshot(showtime());
        },
        see() {
            console.log('curentActivityInstance: ' + curentActivityInstance);
        }
    };
});
// 获取时间，用于命名，和功能无关。
var showtime = function () {
    var nowdate = new Date();
    var year = nowdate.getFullYear(),
        month = nowdate.getMonth() + 1,
        date = nowdate.getDate(),
        day = nowdate.getDay(),
        week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        h = nowdate.getHours(),
        m = nowdate.getMinutes(),
        s = nowdate.getSeconds();
    // return year + "年" + month + "月" + date + "日" + week[day] + " " + h + ":" + m + ":" + s;
    return year + "_" + month + "_" + date + "_" + week[day] + h + ":" + m + ":" + s;
}


/*
    版本1.1
    这是只能截到Activity的版本
    但是可以在更高的安卓版本上使用，需要root(不确定)
*/
console.log('!!!!!!  this is version 1.1  !!!!!!');
Java.perform(function () {
    // 获取一堆包装器
    var fragmentActivity_wrapper: Java.Wrapper = Java.use('androidx.fragment.app.FragmentActivity');
    var bitmap_wrapper: Java.Wrapper = Java.use('android.graphics.Bitmap');
    var file_wrapper: Java.Wrapper = Java.use('java.io.File');
    var fileOutputStream_wrapper: Java.Wrapper = Java.use('java.io.FileOutputStream');
    var compressFormat_wrapper: Java.Wrapper = Java.use('android.graphics.Bitmap$CompressFormat');

    // 用到的全局变量
    var currentActivity: Java.Wrapper;

    // hook "onResume"
    fragmentActivity_wrapper.onResume.implementation = function () {
        console.log('------hook "onResume" success------');
        console.log('get activity name: ' + this.$className);
        // currentActivity = this; // No
        currentActivity = Java.cast(this, Java.use(this.$className)); // Yes
        // console.log('this: '+this);
        // console.log('currentActivity: ' + currentActivity);
        // console.log('currentActivity == this? :' + Boolean(currentActivity == this));
        this.onResume();
        console.log('------exit "onResume"------');
    };

    // 截图方法
    function shots(name: string) {
        try {
            console.log('-----------------------------------');
            console.log("use activity instance: " + currentActivity);
            // 得到DecorView
            var view = currentActivity.getWindow().getDecorView();
            // 这两个方法二选一
            // use shotActivity~~~~
            view.setDrawingCacheEnabled(true);
            var bitmap = bitmap_wrapper.createBitmap(view.getDrawingCache());  // 创建Bitmap
            view.setDrawingCacheEnabled(false);
            // 获取文件保存路径
            var targetPath: string = currentActivity.getFilesDir().toString() + '/images';
            // 获取File类包装器
            var filePath = file_wrapper.$new(targetPath);
            // 如果路径不存在就创建
            if (!filePath.exists()) {
                filePath.mkdirs();
            }
            var saveFile = file_wrapper.$new(targetPath, name);
            console.log('save bitmap: ' + saveFile.toString());
            // 获取包装器
            var stream = fileOutputStream_wrapper.$new(saveFile);
            // 将Bitmap压缩写入流
            bitmap.compress(compressFormat_wrapper.JPEG.value, 80, stream);
            //存储完成后需要清除相关的进程
        } catch (e: any) {
            console.log('error during saving bitmap: ' + e.toString());
        } finally {
            stream.flush();
            stream.close();
        }
    }

    rpc.exports = {
        shot() {
            shots(showtime() + '.jpeg');
        }
    }
})
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


# 第01章-在idea怎么调试jdk源码

工欲善其事，必先利其器。研究并发编程相关原理会经常看jdk源码，因此我们有必要在开发环境中安全的调试jdk源码。

很显然，我们不能直接在你本地安装的jdk里边改源码，加注释。因此我们需要将jdk源码拷贝到项目中，配置项目运行的jdk为我们拷贝的jdk。这样就能愉快的加注释、打断点了。

具体步骤可以参考

[idea查看jdk源码并在源码中写注释](https://blog.csdn.net/weixin_39520967/article/details/104592232)

这篇文章写了非常详细的步骤，还有每一步的截图以及对一些错误的解决方法。

*从openjdk找的那两个类，直接拷贝下来在你的maven工程里边手动创建就可以了，可以直接在[github](https://github.com/yibingxiong/reboot/tree/master/java%E5%9F%BA%E7%A1%80/%E8%B5%84%E6%BA%90)下载,免得找*

**在第一次跑测试demo之前，一定先把文章中给出的可能出现的问题解决好了再跑，争取一次搞定，因为build一次非常慢非常耗费性能，另外，如果出现报错，一定及时杀死进程，因为有一个报错就跑不起来了**

**还有一个坑，大家注意，搞好了就不要随便修改maven依赖了，因为修改后整个又要重新编译，非常慢**

大雄在搭建时还遇到了一个问题

> Error:java: Compilation failed: internal java compiler error

这个问题多半是编译器和jdk版本不匹配导致的


大家如果遇到，可以参考下变这篇文章排查

[Error:java: Compilation failed: internal java compiler error 解决办法](https://blog.csdn.net/jdjdndhj/article/details/70256989)

我本来想着把我搞好的项目放到到github上边，但是看起来不现实，jdk代码太多了，add和commit时太费时间和性能了。
# LockSupport

去AQS里面搜LockSupport，能出来一堆。LockSupport定义了一组的公共静态方法，这些方法提供了最基本的线程阻塞和唤醒功能，而LockSupport也成为构建同步组件的基础工具。

回顾之前的线程的生命周期，我们有能力进Block(阻塞)状态的。但是我们会发现他是需要synchronized的，所以不用synchronized想阻塞线程就没招了。我理解LockSupport应该就是在这样的复杂背景下荣耀登场的吧。

还有更狠的，sync 要用notify notifyAll唤醒，但是notify notifyAll不支持指定具体唤醒哪个线程，阻塞也只能阻塞当前线程，不能阻塞别人。所以说sync虽好，但是太死板了。

## API

```java
public static void unpark(Thread thread)
public static void park()
public static void park(Object blocker)
public static void parkNanos(Object blocker, long nanos)
public static void parkNanos(long nanos)
public static void parkUntil(long deadline)
public static void parkUntil(Object blocker, long deadline)
```
阻塞的姿势比较多，唤醒只有一种姿势。

broker表示阻塞对象，多用于系统监控可问题排查，书上说的，我也不知道

带时间的阻塞有两种，一种是传一个相对时间，表示要阻塞多久；另一种是一个绝对时间，阻塞到啥时候

关于这些API的使用姿势感觉可以直接看AQS源码就好了，里边应该不少的。大雄不看了，用到再说，知道有这么个东西

# CountDownLatch

他跟join比较类似，但是比join来的灵活，join用于让当前执行线程等待join线程执行结束。

CountDownLatch允许一个或多个线程等待其他线程完成操作。

下面这个例子要实现的就是同时开三个线程，主线程需要等待这三个线程执行完后继续执行。

```java
public class TestCountDownLatch implements Runnable {
    CountDownLatch countDownLatch;
    public TestCountDownLatch(CountDownLatch countDownLatch) {
        this.countDownLatch = countDownLatch;
    }
    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + "执行完了");
        countDownLatch.countDown();
    }

    public static void main(String[] args) throws InterruptedException {
        int THREAD_COUNT = 3;
        CountDownLatch countDownLatch = new CountDownLatch(THREAD_COUNT);
        for (int i = 0; i < THREAD_COUNT; i++) {
            new Thread(new TestCountDownLatch(countDownLatch)).start();
        }
        countDownLatch.await();
        System.out.println("主线程继续执行");
    }
}
```

总结一下CountDownLatch的用法：

1. new CountDownLatch(要等待几个线程)
2. 在要等待的地方调用countDownLatch.await() 让他等到countDownLatch减到0时继续执行
3. 每一个线程执行完都调用countDownLatch.countDown()使得countDownLatch减一

## 基本原理

CountDownLatch其实时根据AQS共享式获取同步状态实现的，要等待的线程的个数就是state，countDown相当于state-1, await() 相当于要等到state==0的时候才能获取到锁。

# Semaphore

Semaphore（信号量）是用来控制同时访问特定资源的线程数量，它通过协调各个线程，以保证合理的使用公共资源。

## 使用示例

```java
public class Demo_07_03_1_Semaphore {
    private static Semaphore semaphore = new Semaphore(3);

    public static void main(String[] args) {
        for (int i = 0; i < 30; i++) {
            new Thread(() -> {
                try {
                    semaphore.acquire();    // 相当于获取锁
                    System.out.println(Thread.currentThread().getName() + "执行了");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    semaphore.release();    // 释放锁
                }

            }).start();
        }
    }
}
```

我们同时启动了30个线程去打印，但是我们会发现一次只会有三个输出，三个之后，一会儿再输出。这就是Semaphore带给我们的。

他相当于是一个数量有限的共享锁，没有达到限制就能获得锁，否则阻塞，而这个限制是在构造方法里面指定的。

我没看源码，如果让我实现一个Semaphore， 我一定是用AQS的共享式获取同步状态来做。

## 其他API

这个是书上列出来的，为了保持完成性，也简单列一下：

- intavailablePermits()：返回此信号量中当前可用的许可证数。
- intgetQueueLength()：返回正在等待获取许可证的线程数。
- booleanhasQueuedThreads()：是否有线程正在等待获取许可证。
- void reducePermits（int reduction）：减少reduction个许可证，是个protected方法。
- Collection getQueuedThreads()：返回所有等待获取许可证的线程集合，是个protected方法。

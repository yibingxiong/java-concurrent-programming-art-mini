# CyclicBarrier

让一组线程到达一个屏障（也可以叫同步点）时被阻塞，直到最后一个线程到达屏障时，屏障才会开门，所有被屏障拦截的线程才会继续运行。

CyclicBarrier默认的构造方法是CyclicBarrier（int parties），其参数表示屏障拦截的线程数量，每个线程调用await方法告诉CyclicBarrier我已经到达了屏障，然后当前线程被阻塞。

就像跑步比赛一样，每个人都从各自的地方到达起跑线，到达后跟裁判说一声，当所有人到齐之后，裁判会发出信号，大家一起跑。

## 使用Demo

```java
public class Demo_07_02_1_CylicBarrier {
    public static void main(String[] args) throws BrokenBarrierException, InterruptedException {
        CyclicBarrier cyclicBarrier = new CyclicBarrier(2);
        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                if (i == 3) {
                    try {
                        cyclicBarrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (BrokenBarrierException e) {
                        e.printStackTrace();
                    }
                }
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread().getName()+"----"+i);
            }
        }).start();

        for (int i = 0; i < 5; i++) {
            if (i == 2) {
                cyclicBarrier.await();
            }
            System.out.println(Thread.currentThread().getName()+"----"+i);
        }
    }
}
// 输出如下：
// main----0
// main----1
// Thread-0----0
// Thread-0----1
// Thread-0----2
// main----2
// main----3
// main----4
// Thread-0----3
// Thread-0----4
// 可能不一样，但是main----1输出后一定会等到Thread---2输出后main才会继续
```

使用CyclicBarrier步骤如下：

1. new CyclicBarrier(2) 指定期望多少人到达屏障在继续执行
2. cyclicBarrier.await() 告知别人自己到达屏障了

## 使用场景

CyclicBarrier可以用于多线程并行计算数据，等到所有线程都计算完再合并。


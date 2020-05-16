# Exchanger

> Exchanger用于进行线程间的数据交换。它提供一个同步点，在这个同步点，两个线程可以交换彼此的数据。这两个线程通过exchange方法交换数据，如果第一个线程先执行exchange()方法，它会一直等待第二个线程也执行exchange方法，当两个线程都到达同步点时，这两个线程就可以交换数据，将本线程生产出来的数据传递给对方。(原文复制)

## 使用场景

### 遗传算法

不懂这是个啥玩意儿

### 校对工作

例如将纸制银行流水通过人工的方式录入成电子银行流水，为了避免错误，采用AB岗两人进行录入，录入到Excel之后，系统需要加载这两个Excel，并对两个Excel数据进行校对，看看是否录入一致。

```java
public class Demo_07_04_1_Exchanger {
    static Exchanger<String> exchanger = new Exchanger<>();
    public static void main(String[] args) {
        new Thread(() -> {
            try {
                exchanger.exchange("第1个线程里的值");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        new Thread(() -> {
            try {
                String B = "第2个线程里的值";
                String A = exchanger.exchange(B);
                System.out.println("A:"+A);
                System.out.println("B:"+B);
                System.out.println(A.equals(B));

            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
// 输出：

// A:第1个线程里的值
// B:第2个线程里的值
// false
```

这样就可以达到一个校对的目的
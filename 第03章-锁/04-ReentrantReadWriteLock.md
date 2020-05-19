# ReentrantReadWriteLock

- 读写锁在同一时刻允许多个线程访问
- 当一个写线程访问时，所有其他线程阻塞
- 当一个读线程访问时，其他读线程不会被阻塞
- 读写锁维护了一对锁，一个读锁和一个写锁，通过分离读锁和写锁，使得并发性相比一般的排他锁有了很大提升。
- 在读多于写的情况下，读写锁能够提供比排它锁更好的并发性和吞吐量

## 特性

- 支持公平锁与非公平锁
- 可重入
- 支持锁降级：遵循获取写锁、获取读锁再释放写锁的次序，写锁能够降级为读锁

## 核心API

- ReentrantReadWriteLock.ReadLock  readLock()： 获取读锁
- ReentrantReadWriteLock.WriteLock writeLock()： 获取写锁
- int getReadLockCount()：返回当前读锁被获取到的次数，与线程数无关，同一个线程获取n次 返回n
- int getReadHoldCount()：返回当前线程获取读锁的次数
- boolean isWriteLocked()：判断读锁是否被获取了
- int getWriteHoldCount()：获取当前写锁被获取的次数

## 原理

### 读写状态的设计

读写锁有两个锁，而且他们是有关系的，显然是用一个AQS，但是一个AQS只有一个state。

为了用一个state表示两种锁的状态就需要对状态拆分，int是32位，所以拆成两个部分，高16位标识读状态，低16位标识写状态。

在设置或者获取状态时需要做一些位运算

### 写锁的获取与释放

写锁是一个支持重进入的排它锁。若写状态为0且读状态为0，直接获取写锁；若写状态大于0，看获取同步状态的线程是不是当前线程，是则写状态+1，否则，构建节点进入同步队列，自旋阻塞。

写锁的释放与ReentrantLock的释放过程基本类似，每次释放写状态-1，当写状态为0时表示写锁已被释放，唤醒同步队列里的线程，同时前次写线程的修改对后续读写线程可见。


```java
final boolean tryWriteLock() {
    Thread current = Thread.currentThread();
    int c = getState();
    if (c != 0) {
        int w = exclusiveCount(c); // c与0x0000FFFF求与
        // c！=0但是低16位为0表示有人拿了读锁，有人拿了读锁是不能获取写锁的
        if (w == 0 || current != getExclusiveOwnerThread())
            return false;
        // MAX_COUNT是0xffff, 因为写状态是只有16位的
        if (w == MAX_COUNT)
            throw new Error("Maximum lock count exceeded");
    }
    if (!compareAndSetState(c, c + 1))
        return false;
    setExclusiveOwnerThread(current);
    return true;
}
// 这没啥好说的
protected final boolean tryRelease(int releases) {
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    int nextc = getState() - releases;
    boolean free = exclusiveCount(nextc) == 0;
    if (free)
        setExclusiveOwnerThread(null);
    setState(nextc);
    return free;
}
```

*可以思考下为什么有人拿了读锁不能获取写锁*

### 读锁的获取与释放

读锁是一个支持重进入的共享锁，它能够被多个线程同时获取，写状态位0时总能获取，写状态不为0，不会获取，获取成功读状态就+1。

释放的时候呢就是读状态-1，减到0就是读锁释放了。

当然这里边可能会涉及记录哪些线程获取了读锁，我也没细看，感觉没什么难度。

### 锁降级

锁降级是指把持住（当前拥有的）写锁，再获取到读锁，随后释放（先前拥有的）写锁的过程。

直接搬书上的一个例子

```java
class Process {
    private ReentrantReadWriteLock reentrantReadWriteLock = new ReentrantReadWriteLock();
    private ReentrantReadWriteLock.ReadLock readLock = reentrantReadWriteLock.readLock();
    private ReentrantReadWriteLock.WriteLock writeLock = reentrantReadWriteLock.writeLock();
    private boolean isUpdate = false;
    private LinkedList<Integer> linkedList = new LinkedList<>();

    public void processData() {
        readLock.lock();
        if (!isUpdate) {
            // 必须先释放读书
            readLock.unlock();
            writeLock.lock();
            try {
                if (!isUpdate) {
                    // 模拟生产数据
                    for (int i = 0; i < 1000; i++) {
                        linkedList.push(i);
                    }
                    isUpdate = true;
                }
                readLock.lock(); // 1
            } finally {
                writeLock.unlock();
            }
            // 写锁降级为读锁
        }

        // 2
        try {
            while (!linkedList.isEmpty()) {
                System.out.println(Thread.currentThread().getName() + "消费数据:" + linkedList.poll());
            }
        } finally {
            readLock.unlock();
        }

    }
}

public class Demo_03_04_5_LockChange {
    public static void main(String[] args) {
        Process process = new Process();
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                process.processData();
            }).start();
        }
    }
}
```

根据锁降级还是比较难理解的，为啥要有这个东西，书上原文

> 主要是为了保证数据的可见性，如果当前线程不获取读锁而是直接释放写锁， 假设此刻另一个线程（记作线程T）获取了写锁并修改了数据，那么当前线程无法感知线程T的数据更新。如果当前线程获取读锁，即遵循锁降级的步骤，则线程T将会被阻塞，直到当前线程使用数据并释放读锁之后，线程T才能获取写锁进行数据更新。

假设1不加读锁的话，线程A执行到2这个位置，写锁已经释放了，读锁也没有，所可能恰好此时有别的线程（线程B）获取到了写锁，又修改了数据，此时线程A或的数据还是之前的，这就是他没有感知到线程B对数据的更新。

## 碎碎念

突然想到一个面试题，读写锁中读锁之多可以被多少个线程获取？写锁呢？这个是我自己想到的题。感觉能比较好的考察对读写锁原理的理解。
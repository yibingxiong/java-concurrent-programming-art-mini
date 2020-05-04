# Condition

在第二章第5节已经说了Conditon, 当时用Condition做了一个有界队列。

Condition是Lock的附属物，Condition定义了等待/通知两种类型的方法，当前线程调用这些方法时，需要提前获取到Condition对象关联的锁。

一个锁可以搞多个Condition

## Condition的API

```java
public interface Condition {
    /**
     * 让当前线程进入等待状态直到被通知或者被中断，当前线程重新进入运行状态且从await方法返回的情况如下
     * 1. 其他线程调用了该Condition的signal 或signalAll
     * 2. 其他线程调用interrupt中断了当前线程
     * @throws InterruptedException
     */
    void await() throws InterruptedException;
    /**
     * 等价上面那个
     * @param time
     * @param unit
     * @return
     * @throws InterruptedException
     */
    boolean await(long time, TimeUnit unit) throws InterruptedException;
    /**
     * 指定到某个时间还没被通知且没被中断直接返回，提前被通知了返回true，否则false
     * @param deadline
     * @return
     * @throws InterruptedException
     */
    boolean awaitUntil(Date deadline) throws InterruptedException;
    /**
     * 唤醒等待在Condition上的一个线程
     */
    void signal();
    /**
     * 唤醒所有等待在Condition上的线程
     */
    void signalAll();
}
```

## 基本原理

在ReentrantLock里边搜newCondition

```java
// 我们拿Condition都是通过Lock的newCondition接口拿的
// 但是我们发现他是掉的AQS的newCondition方法
public Condition newCondition() {
    return sync.newCondition();
}

// 在找到AQS的newCondition，发现这个是自己写的
final ConditionObject newCondition() {
    return new ConditionObject();
}
```
可见ConditionObject应该是实现了Condition接口，去看一眼

发现ConditionObject是AQS的内部类

### 等待队列

去看ConditionObject， 会发现里边也和AQS同步队列类似，有一个队列结构，队列节点居然和之前说的同步队列的节点是一样的，世间真奇妙

ConditionObject里边有两个重要成员变量firstWaiter，lastWaiter，对比AQS，AQS有head和tail，这个是双向队列的模板，太巧了

当前线程调用Condition.await()方法，将会以当前线程构造节点，并将节点从尾部加入等待队列。

```java
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    // 构建了一个Node放到等待队列的队尾
    Node node = addConditionWaiter();
    // 我没仔细看，这里大概的意思是会把这个节点从同步队列移除，并且释放锁
    //   因为调用await是获取锁的
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this);
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;
    if (node.nextWaiter != null) // clean up if cancelled
        unlinkCancelledWaiters();
    if (interruptMode != 0)
        reportInterruptAfterWait(interruptMode);
}
```

简单理解，await就是根据当前线程信息构建Node节点，加入等待队列，同时由于调用await的一定是获取锁的，所以我们要移除当前线程在同步队列的那个节点，其实就是首节点，首节点要变，首节点的线程就要释放锁，其实就是当前线程会释放锁。

上边这段描述是我看简单搂了一眼源码写的，发现竟然和书上意思一样，开心~

接下来就是看signal了，感觉能猜到他是怎么做的了


```java
public final void signal() {
    // 必须要获取锁
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    Node first = firstWaiter;
    if (first != null)
        doSignal(first);
}
private void doSignal(Node first) {
    do {
        if ( (firstWaiter = first.nextWaiter) == null)
            lastWaiter = null;
        first.nextWaiter = null;
    } while (!transferForSignal(first) &&
                (first = firstWaiter) != null);
}
final boolean transferForSignal(Node node) {
    if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
        return false;
    // enq前面分析过，就是同步队列的入队
    Node p = enq(node);
    int ws = p.waitStatus;
    if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
        // 很关键，唤醒
        LockSupport.unpark(node.thread);
    return true;
}
``

做了几个事，等待队列首节点出队，将这个首节点入队到同步队列，唤醒这个首节点的线程，唤醒之后就会去竞争锁（或者叫同步状态）了

await方法里面的while (!isOnSyncQueue(node)), 将会不满足条件了，所以await方法会返回

可以发现调用了signal 不是await的地方会立即执行的，需要先抢到锁才会继续执行

signalAll就是把等待队列中的所有节点都转移到同步队列，并唤醒

```java
private void doSignalAll(Node first) {
    lastWaiter = firstWaiter = null;
    do {
        Node next = first.nextWaiter;
        first.nextWaiter = null;
        transferForSignal(first);
        first = next;
    } while (first != null);
}
```
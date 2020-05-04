# ReentrantLock

就是支持重进入的锁，它表示该锁能够支持一个线程对资源的重复加锁。除此之外，该锁的还支持获取锁时的公平和非公平性选择。

## 原理

### 可重入原理

1. 获取的时候如果state==0，那么正常获取，同时记录拥有同步状态的是当前线程，cas更新状态为1；如果state!=0,就要看拥有同步状态的线程是不是和当前线程一样，一样的话，获取成功，同时cas对state+1，不一样则进入同步队列里边自旋阻塞
2. 释放：释放的时候state-1, 如果减到了0，表示释放成功了，否则没有释放成功

### 公平与非公平

公平就是先尝试获取锁的线程会先得到多，非公平则是去竞争锁，默认是非公平的锁

公平的锁多一次判断，导致性能损失，可以避免饥饿

非公平的性能会更高，但是可能会产生饥饿

实现方面非公平和公平的区别就tryAcquire方法不一样

公平的相比于非公平的会多判断一个 !hasQueuedPredecessors()，hasQueuedPredecessors是判断当前节点是否有前驱节点，如果有，证明有比当前节点等待时间长的节点，所以此时失败，返回false，继续等

```java
// 同步队列为空，或者当前节点是头节点 返回false， 返回false，tryAcquire才可能返回true，保证了先来后到
public final boolean hasQueuedPredecessors() {
    Node t = tail; // Read fields in reverse initialization order
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

## 源码

源码不多，直接贴出来

```java
public class ReentrantLock implements Lock, java.io.Serializable {
    private static final long serialVersionUID = 7373984872572414699L;
    private final Sync sync;

    // 跟我们使用AQS一样，也是继承他然后定义一些自己的规则
    abstract static class Sync extends AbstractQueuedSynchronizer {
        private static final long serialVersionUID = -5179523762034025860L;

        abstract void lock();

        final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            // 状态是0表示没有被获取，进行CAS并在CAS成功时返回true
            if (c == 0) {
                if (compareAndSetState(0, acquires)) {
                    // 这个是公平性的保证，他记录了谁获取到同步状态
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                // 有线程获取了锁，这个线程是自己
                int nextc = c + acquires;
                // 很严谨
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                // 可以思考下这里为什么不需要CAS，而前面需要
                setState(nextc);
                return true;
            }
            return false;
        }

        protected final boolean tryRelease(int releases) {
            int c = getState() - releases;
            // 不能释放别人的锁，释放别人的锁感觉是不会出现的，这里很严谨
            if (Thread.currentThread() != getExclusiveOwnerThread())
                throw new IllegalMonitorStateException();
            boolean free = false;
            if (c == 0) {
                free = true;
                // 减到0，就说没有线程在占据锁了
                setExclusiveOwnerThread(null);
            }
            // 更新下状态，这里也是不用CAS，很有学问
            setState(c);

            // 一直要减到0才说你是释放成功的，这是很自然的事情
            return free;
        }

        protected final boolean isHeldExclusively() {
            // 这里直接判断占据锁的线程是不是和当前线程是一个，是的话，就是拿到锁了
            // 这说明我们之前写的锁的实现，这个位置是有点问题的
            return getExclusiveOwnerThread() == Thread.currentThread();
        }
        // Condition后边再说
        final ConditionObject newCondition() {
            return new ConditionObject();
        }

        final Thread getOwner() {
            return getState() == 0 ? null : getExclusiveOwnerThread();
        }

        final int getHoldCount() {
            return isHeldExclusively() ? getState() : 0;
        }

        // =0就是锁了
        final boolean isLocked() {
            return getState() != 0;
        }

        // 这个是与序列化相关的东西
        private void readObject(java.io.ObjectInputStream s)
            throws java.io.IOException, ClassNotFoundException {
            s.defaultReadObject();
            setState(0); // reset to unlocked state
        }
    }

    static final class NonfairSync extends Sync {
        private static final long serialVersionUID = 7316153563782823691L;

        final void lock() {
            // TODO: 这里有别于FairSync，但是我没看得懂为什么FairSync不这么写
            // 或者这里为什么要这么写
            if (compareAndSetState(0, 1))
                setExclusiveOwnerThread(Thread.currentThread());
            else
                acquire(1);
        }

        // 直接调用了Sync里边的nonfairTryAcquire， 这很自然
        protected final boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
    }

    static final class FairSync extends Sync {
        private static final long serialVersionUID = -3000897897090466540L;

        // 公平的lock是直接调了acquire，
        final void lock() {
            acquire(1);
        }

        protected final boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                // 他会查询有没有比你当前线程等的时间更长的线程，这个就是保证公平性了
                if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0)
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }
    }
    public ReentrantLock() {
        // 默认是非公平
        sync = new NonfairSync();
    }

    // 可以指定要公平的还是非公平的锁
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }

    public void lock() {
        sync.lock();
    }

    public void lockInterruptibly() throws InterruptedException {
        sync.acquireInterruptibly(1);
    }

    public boolean tryLock() {
        return sync.nonfairTryAcquire(1);
    }

    public boolean tryLock(long timeout, TimeUnit unit)
            throws InterruptedException {
        return sync.tryAcquireNanos(1, unit.toNanos(timeout));
    }

    public void unlock() {
        sync.release(1);
    }

    public Condition newCondition() {
        return sync.newCondition();
    }
    public int getHoldCount() {
        return sync.getHoldCount();
    }
    public boolean isHeldByCurrentThread() {
        return sync.isHeldExclusively();
    }
    public boolean isLocked() {
        return sync.isLocked();
    }

    public final boolean isFair() {
        return sync instanceof FairSync;
    }

    protected Thread getOwner() {
        return sync.getOwner();
    }
    public final boolean hasQueuedThreads() {
        return sync.hasQueuedThreads();
    }

    public final boolean hasQueuedThread(Thread thread) {
        return sync.isQueued(thread);
    }

    public final int getQueueLength() {
        return sync.getQueueLength();
    }
    protected Collection<Thread> getQueuedThreads() {
        return sync.getQueuedThreads();
    }

    public boolean hasWaiters(Condition condition) {
        if (condition == null)
            throw new NullPointerException();
        if (!(condition instanceof AbstractQueuedSynchronizer.ConditionObject))
            throw new IllegalArgumentException("not owner");
        return sync.hasWaiters((AbstractQueuedSynchronizer.ConditionObject)condition);
    }
    public int getWaitQueueLength(Condition condition) {
        if (condition == null)
            throw new NullPointerException();
        if (!(condition instanceof AbstractQueuedSynchronizer.ConditionObject))
            throw new IllegalArgumentException("not owner");
        return sync.getWaitQueueLength((AbstractQueuedSynchronizer.ConditionObject)condition);
    }

    protected Collection<Thread> getWaitingThreads(Condition condition) {
        if (condition == null)
            throw new NullPointerException();
        if (!(condition instanceof AbstractQueuedSynchronizer.ConditionObject))
            throw new IllegalArgumentException("not owner");
        return sync.getWaitingThreads((AbstractQueuedSynchronizer.ConditionObject)condition);
    }
    public String toString() {
        Thread o = sync.getOwner();
        return super.toString() + ((o == null) ?
                                   "[Unlocked]" :
                                   "[Locked by thread " + o.getName() + "]");
    }
}
```

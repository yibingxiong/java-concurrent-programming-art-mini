# CopyOnWrite系列

## 什么是CopyOnWrite

CopyOnWrite就是写时复制，就是在写操作时，不是直接操作原数据容器，而是先复制一份，在复制的这一份里写，写完再将引用指向复制的这一份。

这样就能保证写的过程中其他线程可以继续读旧的容器里的数据，他们不会变，写完之后再有线程读就可以读到最新的了。

## 基于CopyOnWrite的容器

- CopyOnWriteArrayList
- CopyOnWriteArraySet

## 原理

### CopyOnWriteArrayList

```java
private transient volatile Object[] array;
```
CopyOnWriteArrayList里边核心就是维护这样的一个数组，注意这里加了volatile

先看add

```java
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        newElements[len] = e;
        setArray(newElements);
        return true;
    } finally {
        lock.unlock();
    }
}
```
add的话先加锁，如果不加锁，可能拷贝几份出来，而且会有线程安全问题。

先复制了一个newElements出来，然后改newElements,最后是把容器里维护的array指向newElements

**我们不是加了volatile吗，volatile就能保证内存可见性了，但是为什么要复制一份改变引用呢，请注意volatile并不能保证数组里元素变化的可见性，只能保证引用变化的可见性**


再瞅瞅get

```java
public E get(int index) {
    return get(getArray(), index);
}
```
很简单，不加锁，不cas啥的，直接读。

## CopyOnWriteArraySet

原理和CopyOnWriteArrayList一样，区别就是写的时候会判断存不存在，存在直接返回false，不存在才会复制->修改数据->改引用

## CopyOnWrite的好处

对读不加锁，可以提高读的效率，适用于读多写少的情况

## CopyOnWrite的缺点

1. 浪费内存。因为每次写都会拷贝一份
2. 实时性不高，读线程可能会用老数据
3. 影响GC。写的时候拷贝一份，老的需要被GC掉。

## CopyOnWrite于ReentrantReadWriteLock的对比

- 他们都适用读多写少的情况

- 读的效率CopyOnWrite会更高。因为ReentrantReadWriteLock只要有一个线程获得写锁，所有线程都无法获得读锁，也就是读会被阻塞，但是CopyOnWrite不一样，不管有没有线程在写，他都能读

- 他们写的效率是差不多的，写的时候都是需要获取独占锁的。

- CopyOnWrite读数据实时性要比ReentrantReadWriteLock差。因为当CopyOnWrite读到一批数据在消费时，恰好有别的线程修改了数据，此时读线程还是使用的老的数据；但是ReentrantReadWriteLock不一样，只要有人读，你就不能写，只要有人写，你就不能读

**从上边分析可以看出，我们选型的时候应该要优先CopyOnWrite, 因为他的效率高，如果对实时性要求特别高，不允许读线程读到老数据，那就用ReentrantReadWriteLock**

## 参考资料

- [并发容器之CopyOnWriteArrayList
](https://juejin.im/post/5aeeb55f5188256715478c21)
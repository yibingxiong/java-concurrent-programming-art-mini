# volatile

- volatile是轻量级的synchronized，不会引起线程上下文切换和调度
- 保证了多线程环境下共享变量的“可见性”

*可见性的意思是当一个线程修改一个共享变量时，另外一个线程能读到这个修改的值*

## 实现原理

### 一些CPU术语

|术语|英文|含义|
|----|----|----
|内存屏障|memory Barries|是一组处理器命令，用于实现内存操作的顺序限制。|
|缓冲行||CPU高速缓存中可以分配最小的存储单位。处理器读写缓存行时会加载整个缓存行 。|
|原子操作|atomic operation|不可中断的一个或者一系列操作|
|缓存行填充|cache line fill|当处理器识别到从内存中读取操作是可缓存的。处理器读取整个高速缓存行到适当的缓存（L1 ，L2 ，L3的或所有）|
|缓存命中|cache hit|如果进行高速缓存行填充操作的内存位置任然是下次处理器访问的地址时，处理器从缓存中读取操作数，而不是从内存中读取。|
|写命中|write hit|当处理器将操作数写回到一个内存缓存的区域时，它首先会检查这个缓存的内存地址是否存在缓存行中，如果存在一个有效的缓存行，则处理器将这个操作数写回到缓存，而不是写回到内存，这个操作被称作写命中。|
|写缺失|write misses the cache|一个有效的缓存行被写入到不存在的内存区域|

## volatile原理

volatile声明的变量，转变为汇编会有一个lock指令

lock指令可以实现如下功能：

- 1）将当前处理器缓存行的数据写回到系统内存。
- 2）这个写回内存的操作会使在其他CPU里缓存了该内存地址的数据无效。

volatile的两条实现原则：

- 1）Lock前缀指令会引起处理器缓存回写到内存
- 2）一个处理器的缓存回写到内存会导致其他处理器的缓存无效

## volatile使用优化

**追加字节能优化性能**

原理是部分处理器缓存行是64字节宽，不支持部分填充缓存行。如果队头和队尾节点都不足64字节的话，他们会进到同一个缓存行，当一个处理器试图修改头节点时，会将整个缓存行锁定，那么在缓存一致性机制的作用下，会导致其他处理器不能访问自己高速缓存中的尾节。而首尾巴节点的访问时频繁的，放到同一个缓存行会频繁锁定，造成出队和入队效率低。因此可以采用追加字节的方式避免头节点和尾节点被放到同一个缓存行。

不适用的场景：

1. 缓存行非64字节宽的处理器
2. 共享变量不会被频繁地写
3. java7以下

# java内存模型基础

## Java内存模型的抽象结构

JMM决定一个线程对共享变量的写入何时对另一个线程可见

线程与主内存之间的抽象关系：

线程之间的共享变量存储在主内存（Main Memory）中，每个线程都有一个私有的本地内存（Local Memory），本地内存中存储了该线程以读/写共享变量的副本。本地内存是JMM的一个抽象概念，并不真实存在。它涵盖了缓存、写缓冲区、寄存器以及其他的硬件和编译器优化。

JMM通过控制主内存与每个线程的本地内存之间的交互，来为Java程序员提供内存可见性保证。

## 从源代码到指令序列的重排序

重排序的分类

- 编译器重排序：在不改变单线程程序语义的情况下，重新安排指令执行顺序
- 处理器重排序
  - 指令级并行的重排序：如果不存在数据依赖性，处理器可以改变语句对应机器指令的执行顺序
  - 内存系统的重排序：由于处理器使用缓存和读/写缓冲区，这使得加载和存储操作看上去可能是在乱序执行

JMM的编译器重排序规则会禁止特定类型的编译器重排序

JMM的处理器重排序规则会要求Java编译器在生成指令序列时，插入特定类型的内存屏障（Memory Barriers，Intel称之为Memory Fence）指令，通过内存屏障指令来禁止特定类型的处理器重排序

## 内存屏障（Memory Barriers）

为了保证内存可见性，Java编译器在生成指令序列的适当位置会插入内存屏障指令来禁止特定类型的处理器重排序

|屏障类型|指令示例|说明|
|--------|-------|----|
|LoadLoad Barriers|Load1; LoadLoad; Load2|确保 Load1 数据的装载，之前于 Load2 及所有后续装载指令的装载|
|StoreStore Barriers|Store1; StoreStore; Store2|确保 Store1 数据对其他处理器可见（刷新到内存），之前于 Store2 及所有后续存储指令的存储。|
|LoadStore Barriers|Load1; LoadStore; Store2|确保 Load1 数据装载，之前于 Store2 及所有后续的存储指令刷新到内存|
|StoreLoad Barriers|Store1; StoreLoad; Load2|确保 Store1 数据对其他处理器变得可见（指刷新到内存），之前于 Load2 及所有后续装载指令的装载。StoreLoadBarriers 会使该屏障之前的所有内存访问指令（存储和装载指令）完成之后，才执行该屏障之后的内存访问指令|

StoreLoad Barriers是一个“全能型”的屏障，它同时具有其他3个屏障的效果。现代的多处理器大多支持该屏障

## happens-before简介

从JDK 5开始，Java使用新的JSR-133内存模型

JSR-133使用happens-before的概念来阐述操作之间的内存可见性。在JMM中，如果一个操作执行的结果需要对另一个操作可见，那么这两个操作之间必须要存在happens-before关系


与程序员密切相关的happens-before规则：

- 程序顺序规则：一个线程中的每个操作，happens-before于该线程中的任意后续操作
- 监视器锁规则：对一个锁的解锁，happens-before于随后对这个锁的加锁
- volatile变量规则：对一个volatile域的写，happens- before于任意后续对这个volatile域的读
- 传递性：如果A happens-before B，且B happens-before C，那么Ahappens-before C



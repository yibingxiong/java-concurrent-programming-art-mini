# concurrent包的实现

## concurrent实现的基石

- Java的CAS会使用现代处理器上提供的高效机器级别的原子指令，这些原子指令以原子方式对内存执行读-改-写操作，这是在多处理器中实现同步的关键
- volatile变量的读/写和CAS可以实现线程之间的通信

## concurrent的模式

- 声明共享变量为volatile。
- 使用CAS的原子条件更新来实现线程之间的同步
- 配合以volatile的读/写和CAS所具有的volatile读和写的内存语义来实现线程之间的通信




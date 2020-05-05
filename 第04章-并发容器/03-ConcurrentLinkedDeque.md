# ConcurrentLinkedDeque

基于双向链表实现的双向并发队列，可以分别对头尾进行操作，因此除了先进先出(FIFO)，也可以先进后出（FILO），当然先进后出的话应该叫它栈了。

这个我没看，感觉就是不必ConcurrentLinkedQueue多了两种情况，从队头入队，从队尾出队。有空再看看补充下

TODO: 补充实现原理
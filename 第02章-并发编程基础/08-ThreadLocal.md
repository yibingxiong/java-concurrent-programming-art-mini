# ThereadLocal

是一个以ThreadLocal对象为键、任意对象为值的存储结构。这个结构被附带在线程上，也就是说一个线程可以根据一个ThreadLocal对象查询到绑定在这个线程上的一个值。

## 使用示例

```java
class Profiler {
    // ThreadLocal的创建
    private static ThreadLocal<Long> threadLocal = new ThreadLocal<Long>(){
        @Override
        protected Long initialValue() {
            return System.currentTimeMillis();
        }

    };

    // 记录开始时间
    public static void begin() {
        threadLocal.set(System.currentTimeMillis());
    }

    // 记录耗时
    public static Long end() {
        return System.currentTimeMillis() - threadLocal.get();
    }
}
public class Demo_02_08_1_ThreadLocal {
    public static void main(String[] args) {
        new Thread(() -> {
            Profiler.begin();
            long sum = 1;
            for (int i = 1; i < 20; i++) {
                sum*=i;
            }
            System.out.println(sum);
            System.out.println(Thread.currentThread().getName()+"耗时="+Profiler.end());
        }).start();

        new Thread(() -> {
            Profiler.begin();
            int sum = 1;
            for (int i = 1; i < 1000; i++) {
                sum+=i;
                try {
                    Thread.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            System.out.println(sum);
            System.out.println(Thread.currentThread().getName()+"耗时="+Profiler.end());
        }).start();
    }
}
```

## InheritableThreadLocal

这种ThreadLocal可以从父线程传到子线程，也就是子线程能访问父线程中的InheritableThreadLocal

```java
public class Demo_02_08_2_ThreadLocalInherit {
    static class TestThreadLocalInherit extends Thread{
        @Override
        public void run() {
            System.out.println(threadLocal.get()); // null 
            System.out.println(inheritableThreadLocal.get()); // 欢迎关注微信公众号 大雄和你一起学编程
        }
    }

    public static ThreadLocal<Object> threadLocal = new ThreadLocal<Object>();
    public static InheritableThreadLocal<Object> inheritableThreadLocal = new InheritableThreadLocal<>();
    public static void main(String[] args) {
        inheritableThreadLocal.set("欢迎关注微信公众号 大雄和你一起学编程");
        threadLocal.set("ddd");
        new TestThreadLocalInherit().start();
    }
}
```

## 实现原理

很容易想到，因为这个东西是跟着线程走的，所以应该是线程的一个属性，事实上也是这样，ThreadLocal和InheritableThreadLocal都是存储在Thread里面的。

```java
/* ThreadLocal values pertaining to this thread. This map is maintained
 * by the ThreadLocal class. */
ThreadLocal.ThreadLocalMap threadLocals = null;

/*
 * InheritableThreadLocal values pertaining to this thread. This map is
 * maintained by the InheritableThreadLocal class.
 */
ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
```
上边这个就是Thread的两个成员变量，其实两个是一样的类型。

ThreadLocalMap是ThreadLocal的内部类，他里边是一个用一个Entry数组来存数据的。set时讲ThreadLocal作为key，要存的值传进去，他会对key做一个hash，构建Entry,放到Entry数组里边。

```java
// 伪码
static class ThreadLocalMap {
    // 内部的Entry结构
    static class Entry {...}
    // 存数据的
    private Entry[] table;
    // set
    private void set(ThreadLocal<?> key, Object value) {
        int i = key.threadLocalHashCode & (len-1);
        tab[i] = new Entry(key, value);
    }
    // get
    private Entry getEntry(ThreadLocal<?> key) {
        int i = key.threadLocalHashCode & (table.length - 1);
        Entry e = table[i];
        if (e != null && e.get() == key)
            return e;
        else
            return getEntryAfterMiss(key, i, e);
    }
}
```

再来看看ThreadLocal的get方法

```java
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t); // 这个就是拿到的存在Thread的threadLocals这个变量
    if (map != null) {
        // 这里就是毫无难度的事情了
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    // 这个也很简单，他会调你重写的initialValue方法，拿到一个值，set进去并且返回给你
    // 这个也很有趣，一般init在初始化完成，但是他是在你取的时候去调
    return setInitialValue();
}
```

再来看看ThreadLocal的set, 超级简单,不多说

```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}
```

ThreadLocal看完了，再来瞅瞅InheritableThreadLocals,看看他是怎么可以从父线程那里拿东西的

```java
// 继承了ThreadLocal, 重写了三个方法
public class InheritableThreadLocal<T> extends ThreadLocal<T> {
    // 这个方法在ThreadLocal是直接抛出一个异常UnsupportedOperationException
    protected T childValue(T parentValue) {
        return parentValue;
    }
    // 超简单，我们的Map不要threadLocals了，改为inheritableThreadLocals
    ThreadLocalMap getMap(Thread t) {
       return t.inheritableThreadLocals;
    }
    // 同上
    void createMap(Thread t, T firstValue) {
        t.inheritableThreadLocals = new ThreadLocalMap(this, firstValue);
    }
}
```
发现他和ThreadLocal长得差不多，就是重写了三个方法，由此看来关键在inheritableThreadLocals是如何传递的

直接在Thread里面搜inheritableThreadLocals

你会发现他是在init方法中赋值的，而init实在Thread的构造方法中调用的

```java
// 这个parent就是 创建这个线程的那个线程，也就是父线程
if (inheritThreadLocals && parent.inheritableThreadLocals != null)
this.inheritableThreadLocals = ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
```
看来现在得看看ThreadLocal.createInheritedMap这个方法了

```java
// parentMap就是父线程的inheritableThreadLocals
static ThreadLocalMap createInheritedMap(ThreadLocalMap parentMap) {
    return new ThreadLocalMap(parentMap);
}
// 发现很简单，就是把父线程的东西到自己线程的inheritableThreadLocals里边
private ThreadLocalMap(ThreadLocalMap parentMap) {
    Entry[] parentTable = parentMap.table;
    int len = parentTable.length;
    setThreshold(len);
    table = new Entry[len];

    for (int j = 0; j < len; j++) {
        Entry e = parentTable[j];
        if (e != null) {
            @SuppressWarnings("unchecked")
            ThreadLocal<Object> key = (ThreadLocal<Object>) e.get();
            if (key != null) {
                Object value = key.childValue(e.value);
                Entry c = new Entry(key, value);
                int h = key.threadLocalHashCode & (len - 1);
                while (table[h] != null)
                    h = nextIndex(h, len);
                table[h] = c;
                size++;
            }
        }
    }
}
```

**总结一下**

ThreadLocal和InheritableThreadLocal是基于在Thread里边的两个变量实现的，这两个变量类似于一个HashMap的结构ThreadLocalMap，里边的Entry key为ThreadLocal, value为你存的值. InheritableThreadLocal的实现主要是在线程创建的时候，如果父线程有inheritableThreadLocal, 会被拷贝到子线程。

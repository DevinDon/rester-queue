# 基于 Redis 的延迟消息队列

## 实时消息队列的设计思路 (基于 List)

使用 Redis 的队列 `List` 特性，为每一个 `Topic` 指定一个列表，并使用 `brpop` 来进行阻塞式查询。

1. 首先，使用 `lpush` 向 `Topic` 中新增消息
2. 使用 `brpop` 获取消息

这是基于 PULL 模型设计的队列。

## 实时消息队列的设计思路 (基于 Stream)

使用 Redis Stream 的特性。

1. 首先，使用 `XADD topic id key value [key value ...]` 向指定的 `Topic` 中添加消息
2. 随后，使用 `XREAD [COUNT count] [BLOCK milliseconds] STREAMS topic id` 从指定 `Topic` 中获取消息，允许重复消费

上述是简单的消息生产与消费，接下来是实现消费者分组的方式。

1. 首先，使用 `XGROUP CREATE topic group id` 创建消费者分组，从指定 `id` 开始消费，`id` 可以指定为三种方式：
   1. `0`，指从头开始消费
   2. `$`，指从最新的一条开始消费
   3. `${id}`，从指定的 `id` 开始消费
2. 随后，使用 `XGROUP GROUP group consumer [COUNT count] [BLOCK milliseconds] [NOACK] STREAMS topic` 从消费组中消费数据
3. 当消费者完成消费之后，使用 `XACK topic group id [id ...]` 来将消息标记为已完成，并自动从 PENDING 队列中移除
4. 如果消费者消费失败，那么可以使用 `XPENDING topic group [start end count] [consumer]` 来获取未成功消费的消息，常用的有三种方式：
   1. 获取指定消费组中所有未成功消费的消息 `XPENDING topic group`
   2. 获取指定消费组中最近 10 条未成功消费的消息及其具体属性 `XPENDING topic group - + 10`
   3. 获取指定消费者最近 10 条未消费成功的消息 `XPENDING topic group 10 consumer`
5. 当遇到消息消费失败时，我们需要使用 `XCLAIM topic group consumer min-idel-time-ms id` 来进行消息转移，即：
   1. 找到指定 `id` 的消息
   2. 该消息的 pending 时间 > `min-idel-time-ms`
   3. 将该消息转移至指定的 `consumer` 的 pending 队列中
6. 当一条消息出现了过多次的消费失败，我们认为该消息为死信 DEAD LETTER，我们需要使用 `XDEL topic id [id ...]` 来删除指定的死信

### 如何实现消息队列宕机后的消息恢复？

让对应消费者读取 PENDING 队列中未处理成功的消息并重新处理，可以在消费者端维护一个未 ACK 成功的消息 ID 列表进行消息对比，用于解决重复消费的问题。

### 如何实现消费者宕机后的消息恢复？

让对应消费者读取 PENDING 队列中未处理成功的消息并继续处理。

## 延迟消息队列的设计思路

使用 Redis 过期与过期事件订阅的特性。

1. 首先，为每一条延迟消息生成 `UUID` 并设置为 Key，指定过期时间，称为 `UUID key`
2. 随后，将消息体写入 Key 为 `data-${UUID}` 的 Body 中，称为 `Data Key`
3. 当触发过期事件时，获取过期的 Key 即 `UUID`，并将 `data-${UUID}` 中的 Body 推入实时消息队列所维护的 `Topic` 中
4. 使用之前实时队列的方式拉取消息

### 如何实现宕机后的延迟消息恢复？

1. 当延迟消息到达延迟期限时 `UUID Key` 会过期被移除，但是 `Data Key` 是不会消失的
2. 我们可以通过对比 `UUID Key` 和 `Data Key` 的配对结果，如果某个 `Data Key` 没有配对的 `UUID Key`，那么就说明这条延迟消息已经被触发
3. 直接将其加入 `Topic` 即可

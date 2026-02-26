import { Module } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { TasksModule } from "src/tasks/tasks.module";

@Module({
  providers: [SocketGateway],
  imports: [TasksModule],
})
export class SocketModule {}

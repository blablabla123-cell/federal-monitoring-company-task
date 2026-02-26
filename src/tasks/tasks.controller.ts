import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { Prisma } from "@prisma/client";
import { AccessTokenGuard } from "src/authentication/common/guards";
import { GetTokenPayload } from "src/authentication/common/decorators/get-token-payload.decorator";
import { ResponseDto } from "src/types";
import { TokenPayload } from "src/common/dto/token-payload.dto";
import { CreateTaskDto } from "./dto";

@Controller("events")
export class TasksController {
  constructor(private readonly eventsService: TasksService) { }

  @UseGuards(AccessTokenGuard)
  @Get("user-events")
  @HttpCode(HttpStatus.OK)
  getUserEvents(@GetTokenPayload() payload: TokenPayload) {
    return this.eventsService.getUserTasks(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Get("/favorite-events")
  @HttpCode(HttpStatus.OK)
  loadAnchoredEvents(@GetTokenPayload() payload: TokenPayload) {
    return this.eventsService.loadFavoriteTasks(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Get("/:id")
  @HttpCode(HttpStatus.OK)
  getEventbyId(@Param("id") eventId: string) {
    return this.eventsService.getTaskById(eventId);
  }

  @UseGuards(AccessTokenGuard)
  @Get("/add-to-favourites/:id")
  @HttpCode(HttpStatus.OK)
  addEventToFavourites(
    @GetTokenPayload() payload: TokenPayload,
    @Param("id") eventId: string,
  ) {
    return this.eventsService.addTaskToFavourites(payload, eventId);
  }

  @UseGuards(AccessTokenGuard)
  @Get("/remove-from-favourites/:id")
  @HttpCode(HttpStatus.OK)
  removeEventFromFavourites(
    @GetTokenPayload() payload: TokenPayload,
    @Param("id") eventId: string,
  ) {
    return this.eventsService.removeTaskFromFavourites(payload, eventId);
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetTokenPayload() payload: TokenPayload,
    @Body() createEventDto: CreateTaskDto,
  ) {
    return this.eventsService.createTask(createEventDto, payload);
  }

  @UseGuards(AccessTokenGuard)
  @Post("update/:id")
  @HttpCode(HttpStatus.CREATED)
  update(
    @Param("id") eventId: string,
    @Body() dto: Prisma.TaskUpdateInput,
  ): Promise<ResponseDto> {
    return this.eventsService.updateTask(dto, eventId);
  }

  @UseGuards(AccessTokenGuard)
  @Delete("delete-all-events")
  @HttpCode(HttpStatus.OK)
  deleteAllEvents(): Promise<ResponseDto> {
    return this.eventsService.deleteAllTasks();
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  getAllEvents(
    @GetTokenPayload() payload: TokenPayload,
    @Query("status") status: string,
  ) {
    return this.eventsService.getAllTasks(payload, status);
  }

  @UseGuards(AccessTokenGuard)
  @Post("delete-event/:id")
  @HttpCode(HttpStatus.OK)
  deleteEventById(
    @GetTokenPayload() payload: TokenPayload,
    @Param("id") eventId: string,
  ) {
    return this.eventsService.deleteTaskById(payload, eventId);
  }
}

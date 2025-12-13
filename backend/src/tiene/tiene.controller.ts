import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TieneService } from './tiene.service';
import { CreateTieneDto } from './dto/create-tiene.dto';
import { UpdateTieneDto } from './dto/update-tiene.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('tiene')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TieneController {
  constructor(private readonly tieneService: TieneService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  create(@Body() createTieneDto: CreateTieneDto) {
    return this.tieneService.create(createTieneDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor)
  findAll() {
    return this.tieneService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor)
  findOne(@Param('id') id: string) {
    return this.tieneService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  update(@Param('id') id: string, @Body() updateTieneDto: UpdateTieneDto) {
    return this.tieneService.update(+id, updateTieneDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id') id: string) {
    return this.tieneService.remove(+id);
  }
}

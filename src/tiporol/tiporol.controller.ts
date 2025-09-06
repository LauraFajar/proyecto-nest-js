import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TiporolService } from './tiporol.service';
import { CreateTiporolDto } from './dto/create-tiporol.dto';
import { UpdateTiporolDto } from './dto/update-tiporol.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('tiporol')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TiporolController {
  constructor(private readonly tiporolService: TiporolService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() createTiporolDto: CreateTiporolDto) {
    return this.tiporolService.create(createTiporolDto);
  }

  @Get()
  @Roles(Role.Admin)
  findAll() {
    return this.tiporolService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  findOne(@Param('id') id: string) {
    return this.tiporolService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateTiporolDto: UpdateTiporolDto) {
    return this.tiporolService.update(+id, updateTiporolDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.tiporolService.remove(+id);
  }
}

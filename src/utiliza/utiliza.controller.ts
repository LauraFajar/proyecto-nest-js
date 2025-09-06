import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UtilizaService } from './utiliza.service';
import { CreateUtilizaDto } from './dto/create-utiliza.dto';
import { UpdateUtilizaDto } from './dto/update-utiliza.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('utiliza')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UtilizaController {
  constructor(private readonly utilizaService: UtilizaService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  create(@Body() createUtilizaDto: CreateUtilizaDto) {
    return this.utilizaService.create(createUtilizaDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor)
  findAll() {
    return this.utilizaService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor)
  findOne(@Param('id') id: string) {
    return this.utilizaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  update(@Param('id') id: string, @Body() updateUtilizaDto: UpdateUtilizaDto) {
    return this.utilizaService.update(+id, updateUtilizaDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id') id: string) {
    return this.utilizaService.remove(+id);
  }
}

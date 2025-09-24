import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SublotesService } from './sublotes.service';
import { CreateSubloteDto } from './dto/create-sublote.dto';
import { UpdateSubloteDto } from './dto/update-sublote.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('sublotes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SublotesController {
  constructor(private readonly sublotesService: SublotesService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  create(@Body() createSubloteDto: CreateSubloteDto) {
    return this.sublotesService.create(createSubloteDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findAll() {
    return this.sublotesService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findOne(@Param('id') id: string) {
    return this.sublotesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  update(@Param('id') id: string, @Body() updateSubloteDto: UpdateSubloteDto) {
    return this.sublotesService.update(+id, updateSubloteDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id') id: string) {
    return this.sublotesService.remove(+id);
  }
}
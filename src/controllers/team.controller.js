import prisma from '../config/prisma.js';

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
export const getTeamMembers = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const members = await prisma.teamMember.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Erro ao buscar membros da equipe' });
  }
};

// @desc    Get single team member
// @route   GET /api/team/:id
// @access  Public
export const getTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.teamMember.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    res.json(member);
  } catch (error) {
    console.error('Get team member error:', error);
    res.status(500).json({ message: 'Erro ao buscar membro' });
  }
};

// @desc    Create team member
// @route   POST /api/team
// @access  Private/Admin
export const createTeamMember = async (req, res) => {
  try {
    const { name, role, bio, email, linkedin, twitter, order } = req.body;

    const member = await prisma.teamMember.create({
      data: {
        name,
        role,
        bio,
        email,
        linkedin,
        twitter,
        order: order || 0,
        avatar: req.file?.path || null
      }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ message: 'Erro ao criar membro' });
  }
};

// @desc    Update team member
// @route   PUT /api/team/:id
// @access  Private/Admin
export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, bio, email, linkedin, twitter, order, isActive } = req.body;

    const data = {
      name,
      role,
      bio,
      email,
      linkedin,
      twitter,
      order,
      isActive
    };

    if (req.file) {
      data.avatar = req.file.path;
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data
    });

    res.json(member);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ message: 'Erro ao atualizar membro' });
  }
};

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Private/Admin
export const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teamMember.delete({
      where: { id }
    });

    res.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ message: 'Erro ao remover membro' });
  }
};

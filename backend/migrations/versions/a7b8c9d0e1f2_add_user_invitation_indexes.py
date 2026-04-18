"""add indexes on users.company_id + invitations.company_id/email

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-04-18

Indexes pour queries fréquentes :
- users.company_id : members list, admin lookups
- invitations.company_id : list pending invites par entreprise
- invitations.email : check doublons lors d'invite
"""
from alembic import op

revision = 'a7b8c9d0e1f2'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('idx_users_company_id', 'users', ['company_id'])
    op.create_index('idx_invitations_company_id', 'invitations', ['company_id'])
    op.create_index('idx_invitations_email', 'invitations', ['email'])


def downgrade() -> None:
    op.drop_index('idx_invitations_email', 'invitations')
    op.drop_index('idx_invitations_company_id', 'invitations')
    op.drop_index('idx_users_company_id', 'users')

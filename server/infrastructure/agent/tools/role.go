package tools

import (
	"context"
	"fmt"
	"strings"

	system_db "sag-reg-server/app/system/models/db"
	system_repo "sag-reg-server/app/system/repository"
)

// 角色操作工具集
type RoleTools struct {
	roleRepo system_repo.RoleRepository
}

// 创建角色工具集
func NewRoleTools(roleRepo system_repo.RoleRepository) *RoleTools {
	return &RoleTools{
		roleRepo: roleRepo,
	}
}

// 创建角色
func (t *RoleTools) CreateRole(ctx context.Context, params map[string]interface{}) (string, error) {
	name, ok := params["name"].(string)
	if !ok || name == "" {
		return "", fmt.Errorf("缺少角色名称参数: name")
	}

	description := ""
	if desc, ok := params["description"].(string); ok {
		description = desc
	}

	role := &system_db.Role{
		Name:        name,
		Description: stringToPointer(description),
	}

	if err := t.roleRepo.Create(ctx, role); err != nil {
		return "", fmt.Errorf("创建角色失败: %w", err)
	}

	return fmt.Sprintf("✅ 已成功创建角色 \"%s\"%s",
		name,
		func() string {
			if description != "" {
				return fmt.Sprintf("，描述：%s", description)
			}
			return ""
		}()), nil
}

// 更新角色
func (t *RoleTools) UpdateRole(ctx context.Context, params map[string]interface{}) (string, error) {
	id, ok := params["id"].(string)
	if !ok || id == "" {
		return "", fmt.Errorf("缺少角色ID参数: id")
	}

	// 获取现有角色
	role, err := t.roleRepo.FindOne(ctx, id)
	if err != nil {
		return "", fmt.Errorf("角色不存在或已被删除")
	}

	// 更新字段
	if name, ok := params["name"].(string); ok && name != "" {
		role.Name = name
	}
	if desc, ok := params["description"].(string); ok {
		role.Description = stringToPointer(desc)
	}

	if err := t.roleRepo.Update(ctx, role); err != nil {
		return "", fmt.Errorf("更新角色失败: %w", err)
	}

	return fmt.Sprintf("✅ 已成功更新角色 \"%s\"", role.Name), nil
}

// 删除角色
func (t *RoleTools) DeleteRole(ctx context.Context, params map[string]interface{}) (string, error) {
	id, ok := params["id"].(string)
	if !ok || id == "" {
		return "", fmt.Errorf("缺少角色ID参数: id")
	}

	// 获取角色信息（删除前）
	role, err := t.roleRepo.FindOne(ctx, id)
	if err != nil {
		return "", fmt.Errorf("角色不存在或已被删除")
	}

	if err := t.roleRepo.Delete(ctx, id); err != nil {
		return "", fmt.Errorf("删除角色失败: %w", err)
	}

	return fmt.Sprintf("✅ 已成功删除角色 \"%s\"", role.Name), nil
}

// 获取角色详情
func (t *RoleTools) GetRole(ctx context.Context, params map[string]interface{}) (string, error) {
	id, ok := params["id"].(string)
	if !ok || id == "" {
		return "", fmt.Errorf("缺少角色ID参数: id")
	}

	role, err := t.roleRepo.FindOne(ctx, id)
	if err != nil {
		return "", fmt.Errorf("角色不存在或已被删除")
	}

	result := fmt.Sprintf("角色信息:\n名称: %s\n描述: %s\n创建时间: %s",
		role.Name,
		func() string {
			if role.Description != nil {
				return *role.Description
			}
			return "(无描述)"
		}(),
		role.CreatedAt.Format("2006-01-02 15:04:05"),
	)

	return result, nil
}

// 列出所有角色
func (t *RoleTools) ListRoles(ctx context.Context, params map[string]interface{}) (string, error) {
	roles, err := t.roleRepo.FindList(ctx)
	if err != nil {
		return "", fmt.Errorf("获取角色列表失败: %w", err)
	}

	if len(roles) == 0 {
		return "当前没有任何角色。", nil
	}

	result := fmt.Sprintf("📋 当前共有 %d 个角色：\n\n", len(roles))
	for i, role := range roles {
		desc := ""
		if role.Description != nil {
			desc = fmt.Sprintf(" - %s", *role.Description)
		}
		result += fmt.Sprintf("%d. %s%s\n", i+1, role.Name, desc)
	}

	return result, nil
}

// 搜索角色
func (t *RoleTools) SearchRoles(ctx context.Context, params map[string]interface{}) (string, error) {
	keyword, ok := params["keyword"].(string)
	if !ok || keyword == "" {
		return "", fmt.Errorf("缺少搜索关键词参数: keyword")
	}

	roles, err := t.roleRepo.FindList(ctx)
	if err != nil {
		return "", fmt.Errorf("获取角色列表失败: %w", err)
	}

	var matched []string
	for _, role := range roles {
		matchName := strings.Contains(strings.ToLower(role.Name), strings.ToLower(keyword))
		matchDesc := role.Description != nil &&
			strings.Contains(strings.ToLower(*role.Description), strings.ToLower(keyword))

		if matchName || matchDesc {
			matched = append(matched, fmt.Sprintf("- %s", role.Name))
		}
	}

	if len(matched) == 0 {
		return fmt.Sprintf("未找到包含关键词 \"%s\" 的角色", keyword), nil
	}

	return fmt.Sprintf("找到 %d 个相关角色：\n%s", len(matched), strings.Join(matched, "\n")), nil
}

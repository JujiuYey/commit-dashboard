package tools

import (
	"context"
	"fmt"
	"strings"

	system_db "sag-reg-server/app/system/models/db"
	system_repo "sag-reg-server/app/system/repository"
)

// 部门操作工具集
type DepartmentTools struct {
	deptRepo system_repo.DepartmentRepository
}

// 创建部门工具集
func NewDepartmentTools(deptRepo system_repo.DepartmentRepository) *DepartmentTools {
	return &DepartmentTools{
		deptRepo: deptRepo,
	}
}

// 创建部门
func (t *DepartmentTools) CreateDepartment(ctx context.Context, params map[string]interface{}) (string, error) {
	name, ok := params["name"].(string)
	if !ok || name == "" {
		return "", fmt.Errorf("缺少部门名称参数: name")
	}

	description := ""
	if desc, ok := params["description"].(string); ok {
		description = desc
	}

	department := &system_db.Department{
		Name:        name,
		Description: stringToPointer(description),
		ParentID:    nil,
	}

	if err := t.deptRepo.Create(ctx, department); err != nil {
		return "", fmt.Errorf("创建部门失败: %w", err)
	}

	return fmt.Sprintf("✅ 已成功创建部门 \"%s\"%s",
		name,
		func() string {
			if description != "" {
				return fmt.Sprintf("，描述：%s", description)
			}
			return ""
		}()), nil
}

// 更新部门
func (t *DepartmentTools) UpdateDepartment(ctx context.Context, params map[string]interface{}) (string, error) {
	id, ok := params["id"].(string)
	if !ok || id == "" {
		return "", fmt.Errorf("缺少部门ID参数: id")
	}

	// 获取现有部门
	department, err := t.deptRepo.FindOne(ctx, id)
	if err != nil {
		return "", fmt.Errorf("部门不存在或已被删除")
	}

	// 更新字段
	if name, ok := params["name"].(string); ok && name != "" {
		department.Name = name
	}
	if desc, ok := params["description"].(string); ok {
		department.Description = stringToPointer(desc)
	}

	if err := t.deptRepo.Update(ctx, department); err != nil {
		return "", fmt.Errorf("更新部门失败: %w", err)
	}

	return fmt.Sprintf("✅ 已成功更新部门 \"%s\"", department.Name), nil
}

// 删除部门
func (t *DepartmentTools) DeleteDepartment(ctx context.Context, params map[string]interface{}) (string, error) {
	id, ok := params["id"].(string)
	if !ok || id == "" {
		return "", fmt.Errorf("缺少部门ID参数: id")
	}

	// 获取部门信息（删除前）
	department, err := t.deptRepo.FindOne(ctx, id)
	if err != nil {
		return "", fmt.Errorf("部门不存在或已被删除")
	}

	if err := t.deptRepo.Delete(ctx, id); err != nil {
		return "", fmt.Errorf("删除部门失败: %w", err)
	}

	return fmt.Sprintf("✅ 已成功删除部门 \"%s\"", department.Name), nil
}

// 获取部门详情
func (t *DepartmentTools) GetDepartment(ctx context.Context, params map[string]interface{}) (string, error) {
	id, ok := params["id"].(string)
	if !ok || id == "" {
		return "", fmt.Errorf("缺少部门ID参数: id")
	}

	department, err := t.deptRepo.FindOne(ctx, id)
	if err != nil {
		return "", fmt.Errorf("部门不存在或已被删除")
	}

	result := fmt.Sprintf("部门信息:\n名称: %s\n描述: %s\n创建时间: %s",
		department.Name,
		func() string {
			if department.Description != nil {
				return *department.Description
			}
			return "(无描述)"
		}(),
		department.CreatedAt.Format("2006-01-02 15:04:05"),
	)

	return result, nil
}

// 列出所有部门
func (t *DepartmentTools) ListDepartments(ctx context.Context, params map[string]interface{}) (string, error) {
	departments, err := t.deptRepo.FindList(ctx)
	if err != nil {
		return "", fmt.Errorf("获取部门列表失败: %w", err)
	}

	if len(departments) == 0 {
		return "当前没有任何部门。", nil
	}

	result := fmt.Sprintf("📋 当前共有 %d 个部门：\n\n", len(departments))
	for i, dept := range departments {
		desc := ""
		if dept.Description != nil {
			desc = fmt.Sprintf(" - %s", *dept.Description)
		}
		result += fmt.Sprintf("%d. %s%s\n", i+1, dept.Name, desc)
	}

	return result, nil
}

// 搜索部门
func (t *DepartmentTools) SearchDepartments(ctx context.Context, params map[string]interface{}) (string, error) {
	keyword, ok := params["keyword"].(string)
	if !ok || keyword == "" {
		return "", fmt.Errorf("缺少搜索关键词参数: keyword")
	}

	departments, _, err := t.deptRepo.FindPage(ctx, 1, 100)
	if err != nil {
		return "", fmt.Errorf("获取部门列表失败: %w", err)
	}

	var matched []string
	for _, dept := range departments {
		matchName := strings.Contains(strings.ToLower(dept.Name), strings.ToLower(keyword))
		matchDesc := dept.Description != nil &&
			strings.Contains(strings.ToLower(*dept.Description), strings.ToLower(keyword))

		if matchName || matchDesc {
			matched = append(matched, fmt.Sprintf("- %s", dept.Name))
		}
	}

	if len(matched) == 0 {
		return fmt.Sprintf("未找到包含关键词 \"%s\" 的部门", keyword), nil
	}

	return fmt.Sprintf("找到 %d 个相关部门：\n%s", len(matched), strings.Join(matched, "\n")), nil
}

// stringToPointer 将字符串转换为指针
func stringToPointer(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
